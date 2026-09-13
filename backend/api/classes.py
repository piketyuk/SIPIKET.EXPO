from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.models.database import get_db
from backend.models.models import User, Class, Enrollment, AuditLog, Regu
from backend.utils.security import verify_token, sanitize_input
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional, List

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

class CreateClassRequest(BaseModel):
    code: str
    name: str
    max_students: Optional[int] = 40
    theme: Optional[str] = "dark"

class UpdateClassRequest(BaseModel):
    name: Optional[str] = None
    max_students: Optional[int] = None
    theme: Optional[str] = None

class ReguRequest(BaseModel):
    day: str
    member_emails: List[str]

@router.post("/")
async def create_class(req: CreateClassRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "guru":
        raise HTTPException(status_code=403, detail="Hanya guru yang bisa membuat kelas")
    code = req.code.strip().upper()
    if not (6 <= len(code) <= 10):
        raise HTTPException(status_code=400, detail="Kode kelas 6-10 karakter")
    existing = db.query(Class).filter(Class.code == code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Kode kelas sudah digunakan")
    name = sanitize_input(req.name, 100)
    if not name:
        raise HTTPException(status_code=400, detail="Nama kelas tidak valid")
    new_class = Class(code=code, name=name, theme=req.theme or "dark", max_students=req.max_students or 40, created_by=current_user.email)
    db.add(new_class)
    db.commit()
    return {"message": "Kelas berhasil dibuat", "class": {"code": new_class.code, "name": new_class.name, "theme": new_class.theme, "max_students": new_class.max_students}}

@router.get("/{class_code}")
async def get_class(class_code: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cls = db.query(Class).filter(Class.code == class_code).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")
    if current_user.role == "guru" and cls.created_by != current_user.email:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    enrollment = db.query(Enrollment).filter(Enrollment.class_code == class_code, Enrollment.user_id == current_user.id).first()
    if not enrollment and current_user.role == "siswa":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    student_count = db.query(Enrollment).filter(Enrollment.class_code == class_code).count()
    return {"code": cls.code, "name": cls.name, "theme": cls.theme, "max_students": cls.max_students, "student_count": student_count, "created_by": cls.created_by, "created_at": cls.created_at}

@router.put("/{class_code}")
async def update_class(class_code: str, req: UpdateClassRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cls = db.query(Class).filter(Class.code == class_code).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")
    if cls.created_by != current_user.email:
        raise HTTPException(status_code=403, detail="Hanya pembuat kelas yang bisa mengubah")
    if req.name:
        cls.name = sanitize_input(req.name, 100)
    if req.max_students:
        if not (1 <= req.max_students <= 40):
            raise HTTPException(status_code=400, detail="Kuota 1-40 siswa")
        cls.max_students = req.max_students
    if req.theme:
        if req.theme not in ["dark", "biru"]:
            raise HTTPException(status_code=400, detail="Tema tidak valid")
        cls.theme = req.theme
    db.commit()
    return {"message": "Kelas berhasil diperbarui"}

@router.post("/{class_code}/join")
async def join_class(class_code: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "siswa":
        raise HTTPException(status_code=403, detail="Hanya siswa yang bisa join kelas")
    code = class_code.strip().upper()
    cls = db.query(Class).filter(Class.code == code).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Kode kelas tidak ditemukan")
    existing = db.query(Enrollment).filter(Enrollment.user_id == current_user.id, Enrollment.class_code == code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Sudah bergabung ke kelas ini")
    student_count = db.query(Enrollment).filter(Enrollment.class_code == code).count()
    if student_count >= cls.max_students:
        raise HTTPException(status_code=400, detail="Kuota kelas penuh")
    enrollment = Enrollment(user_id=current_user.id, class_code=code)
    db.add(enrollment)
    db.commit()
    return {"message": "Berhasil masuk ke kelas", "class_name": cls.name}

@router.get("/{class_code}/students")
async def get_students(class_code: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cls = db.query(Class).filter(Class.code == class_code).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")
    if cls.created_by != current_user.email:
        raise HTTPException(status_code=403, detail="Hanya guru pembuat")
    enrollments = db.query(Enrollment).filter(Enrollment.class_code == class_code).all()
    students = []
    for enrollment in enrollments:
        user = enrollment.user
        students.append({"id": user.id, "email": user.email, "name": user.display_name, "nickname": user.nickname, "avatar": user.avatar_url, "joined_at": enrollment.joined_at})
    return {"students": students}

@router.delete("/{class_code}/students/{student_email}")
async def kick_student(class_code: str, student_email: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cls = db.query(Class).filter(Class.code == class_code).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")
    if cls.created_by != current_user.email:
        raise HTTPException(status_code=403, detail="Hanya guru pembuat")
    student = db.query(User).filter(User.email == student_email).first()
    if not student:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan")
    enrollment = db.query(Enrollment).filter(Enrollment.user_id == student.id, Enrollment.class_code == class_code).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Siswa tidak ada di kelas ini")
    student.is_blacklisted = True
    student.blacklist_until = datetime.utcnow() + timedelta(days=1)
    db.delete(enrollment)
    audit = AuditLog(actor_email=current_user.email, action="kick_siswa", target_email=student_email, details=f"Dikick dari kelas {class_code}")
    db.add(audit)
    db.commit()
    return {"message": "Siswa berhasil dikick"}

@router.post("/{class_code}/regu")
async def set_regu(class_code: str, req: ReguRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cls = db.query(Class).filter(Class.code == class_code).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")
    if cls.created_by != current_user.email:
        raise HTTPException(status_code=403, detail="Hanya guru pembuat")
    valid_days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]
    if req.day not in valid_days:
        raise HTTPException(status_code=400, detail="Hari tidak valid")
    if len(req.member_emails) > 9:
        raise HTTPException(status_code=400, detail="Maksimal 9 siswa per hari")
    old_regu = db.query(Regu).filter(Regu.class_code == class_code, Regu.day == req.day).first()
    if old_regu:
        db.delete(old_regu)
    new_regu = Regu(class_code=class_code, day=req.day)
    db.add(new_regu)
    db.flush()
    for email in req.member_emails:
        member = db.query(User).filter(User.email == email).first()
        if member:
            new_regu.members = [member]
    db.commit()
    return {"message": f"Regu {req.day} berhasil diatur"}
