from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from backend.models.database import get_db
from backend.models.models import User, AuditLog
from backend.utils.security import verify_token, hash_password, verify_password, sanitize_input
from backend.utils.video import video_service
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import tempfile
import os

router = APIRouter()

async def get_current_user(authorization: str = None, db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token tidak ditemukan")
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token tidak valid")
    email = payload.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    return user

class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = None
    nickname: Optional[str] = None

class UpdatePasswordRequest(BaseModel):
    old_password: str
    new_password: str

@router.get("/me")
async def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "display_name": current_user.display_name,
        "nickname": current_user.nickname,
        "role": current_user.role,
        "avatar_url": current_user.avatar_url,
        "class_code": current_user.class_code,
        "registered_at": current_user.registered_at
    }

@router.put("/profile")
async def update_profile(req: UpdateProfileRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if req.display_name:
        current_user.display_name = sanitize_input(req.display_name, 100)
    if req.nickname:
        current_user.nickname = sanitize_input(req.nickname, 50)
    current_user.profile_updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Profil diperbarui", "user": {"email": current_user.email, "display_name": current_user.display_name, "nickname": current_user.nickname}}

@router.post("/avatar")
async def upload_avatar(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File harus berupa gambar")
    if file.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File maksimal 5MB")
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        url = video_service.upload_image(tmp_path, current_user.email)
        if not url:
            raise HTTPException(status_code=500, detail="Gagal upload foto")
        current_user.avatar_url = url
        db.commit()
        return {"message": "Foto profil diperbarui", "avatar_url": url}
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@router.put("/password")
async def update_password(req: UpdatePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(req.old_password, current_user.password_hash or ""):
        raise HTTPException(status_code=401, detail="Password lama tidak sesuai")
    if current_user.last_password_change:
        diff = datetime.utcnow() - current_user.last_password_change
        if diff.days < 7:
            raise HTTPException(status_code=400, detail="Password baru hanya boleh diubah 1x/minggu")
    from backend.utils.security import validate_password
    valid, msg = validate_password(req.new_password)
    if not valid:
        raise HTTPException(status_code=400, detail=msg)
    current_user.password_hash = hash_password(req.new_password)
    current_user.last_password_change = datetime.utcnow()
    audit = AuditLog(actor_email=current_user.email, action="change_password", target_email=current_user.email, details="User mengubah password")
    db.add(audit)
    db.commit()
    return {"message": "Password berhasil diperbarui"}

@router.delete("/account")
async def delete_account(password: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(password, current_user.password_hash or ""):
        raise HTTPException(status_code=401, detail="Password tidak sesuai")
    audit = AuditLog(actor_email=current_user.email, action="delete_account", target_email=current_user.email, details="User menghapus akunnya sendiri")
    db.add(audit)
    db.delete(current_user)
    db.commit()
    return {"message": "Akun berhasil dihapus"}

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logout berhasil"}
