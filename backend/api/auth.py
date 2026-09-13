from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.models.database import get_db
from backend.models.models import User, OTPSession, TeacherCode, Class
from backend.utils.security import hash_password, verify_password, create_access_token, create_refresh_token, generate_otp, verify_token, sanitize_input, validate_password
from backend.utils.cache import rate_limiter, login_lockout, session_cache
from backend.utils.email import email_service
from backend.config import settings
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import httpx

router = APIRouter()

class RegisterRequest(BaseModel):
    email: EmailStr
    display_name: str
    password: str
    class_code: str = None
    teacher_code: str = None
    hcaptcha_token: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    hcaptcha_token: str

class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str

class CodeVerifyRequest(BaseModel):
    code: str
    is_teacher: bool = False

async def verify_hcaptcha(token: str) -> bool:
    if not settings.HCAPTCHA_SECRET:
        return True
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://hcaptcha.com/siteverify",
                data={"secret": settings.HCAPTCHA_SECRET, "response": token},
                timeout=5
            )
            result = response.json()
            return result.get("success", False)
    except:
        return False

@router.post("/register")
async def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if not await verify_hcaptcha(req.hcaptcha_token):
        raise HTTPException(status_code=400, detail="CAPTCHA tidak valid")
    
    if not rate_limiter.is_allowed(f"register:{req.email}", max_attempts=5, window_seconds=3600):
        raise HTTPException(status_code=429, detail="Terlalu banyak percobaan. Coba lagi nanti.")
    
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    
    display_name = sanitize_input(req.display_name, 100)
    if not display_name:
        raise HTTPException(status_code=400, detail="Nama tidak valid")
    
    valid, msg = validate_password(req.password)
    if not valid:
        raise HTTPException(status_code=400, detail=msg)
    
    class_code = None
    if req.class_code:
        class_code = req.class_code.strip().upper()
        if not (6 <= len(class_code) <= 10):
            raise HTTPException(status_code=400, detail="Kode kelas tidak valid")
    
    if req.teacher_code:
        teacher = db.query(TeacherCode).filter(TeacherCode.code == req.teacher_code).first()
        if not teacher or teacher.used_count >= teacher.max_users:
            raise HTTPException(status_code=400, detail="Kode guru tidak valid atau kuota habis")
    
    password_hash = hash_password(req.password)
    new_user = User(
        email=req.email,
        display_name=display_name,
        password_hash=password_hash,
        role="guru" if req.teacher_code else "siswa",
        class_code=class_code,
        registered_at=datetime.utcnow()
    )
    
    db.add(new_user)
    db.commit()
    
    if req.teacher_code:
        teacher = db.query(TeacherCode).filter(TeacherCode.code == req.teacher_code).first()
        teacher.used_count += 1
        db.commit()
    
    verification_token = create_access_token({"email": req.email}, timedelta(hours=24))
    verify_link = f"{settings.FRONTEND_URL}/verify?token={verification_token}"
    email_service.send_verification_email(req.email, verify_link, display_name)
    
    return {"message": "Registrasi berhasil. Cek email untuk verifikasi.", "email": req.email}

@router.post("/login")
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    if not await verify_hcaptcha(req.hcaptcha_token):
        raise HTTPException(status_code=400, detail="CAPTCHA tidak valid")
    
    if login_lockout.check_lockout(req.email):
        raise HTTPException(status_code=429, detail="Akun terkunci. Coba lagi nanti.")
    
    if not rate_limiter.is_allowed(f"login:{req.email}", max_attempts=settings.RATE_LIMIT_LOGIN, window_seconds=900):
        login_lockout.record_failed_attempt(req.email)
        raise HTTPException(status_code=429, detail="Terlalu banyak percobaan gagal.")
    
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash or ""):
        login_lockout.record_failed_attempt(req.email)
        raise HTTPException(status_code=401, detail="Email atau password salah")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Akun tidak aktif")
    
    login_lockout.reset_attempts(req.email)
    user.last_login_at = datetime.utcnow()
    db.commit()
    
    access_token = create_access_token({"sub": user.email, "role": user.role})
    refresh_token = create_refresh_token({"sub": user.email})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "name": user.display_name,
            "role": user.role
        }
    }

@router.post("/request-otp")
async def request_otp(req: OTPRequest, db: Session = Depends(get_db)):
    if not rate_limiter.is_allowed(f"otp:{req.email}", max_attempts=3, window_seconds=3600):
        raise HTTPException(status_code=429, detail="Terlalu banyak percobaan. Coba lagi nanti.")
    
    otp = generate_otp()
    session_cache.set_otp(req.email, otp, expires_minutes=1)
    
    success = email_service.send_otp_email(req.email, otp)
    if not success:
        raise HTTPException(status_code=500, detail="Gagal mengirim OTP")
    
    return {"message": "OTP dikirim ke email Anda", "email": req.email}

@router.post("/verify-otp")
async def verify_otp(req: OTPVerifyRequest, db: Session = Depends(get_db)):
    if not session_cache.verify_otp(req.email, req.otp):
        raise HTTPException(status_code=400, detail="OTP tidak valid atau sudah kadaluarsa")
    
    token = create_access_token({"email": req.email, "otp_verified": True}, timedelta(hours=1))
    return {"message": "OTP terverifikasi", "token": token}

@router.post("/verify-code")
async def verify_code(req: CodeVerifyRequest, db: Session = Depends(get_db)):
    code = req.code.strip().upper()
    
    if req.is_teacher:
        teacher = db.query(TeacherCode).filter(TeacherCode.code == code).first()
        if not teacher or teacher.used_count >= teacher.max_users:
            raise HTTPException(status_code=400, detail="Kode guru tidak valid")
        return {"valid": True, "type": "teacher"}
    else:
        cls = db.query(Class).filter(Class.code == code).first()
        if not cls:
            raise HTTPException(status_code=400, detail="Kode kelas tidak ditemukan")
        return {"valid": True, "type": "class", "class_name": cls.name}

@router.post("/refresh")
async def refresh_token(refresh_token: str):
    payload = verify_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Token tidak valid")
    
    email = payload.get("sub")
    new_access_token = create_access_token({"sub": email})
    
    return {"access_token": new_access_token, "token_type": "bearer"}

@router.post("/google")
async def google_login(id_token: str, db: Session = Depends(get_db)):
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth belum dikonfigurasi")
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}")
            info = r.json()
            if info.get("aud") != settings.GOOGLE_CLIENT_ID:
                raise HTTPException(status_code=401, detail="Google token tidak valid")
            email = info.get("email")
            sub = info.get("sub")
            name = info.get("name") or email
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Google verifikasi gagal: {str(e)[:200]}")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=403, detail="Email belum terdaftar — daftar dulu via register")
    if not user.google_sub:
        user.google_sub = sub
        db.commit()
    elif user.google_sub != sub:
        raise HTTPException(status_code=401, detail="Akun Google tidak cocok")
    user.last_login_at = datetime.utcnow()
    db.commit()
    access_token = create_access_token({"sub": user.email, "role": user.role})
    refresh_token = create_refresh_token({"sub": user.email})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer", "user": {"email": user.email, "name": user.display_name, "role": user.role}}
