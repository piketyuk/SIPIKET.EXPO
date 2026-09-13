from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.models.database import get_db
from backend.models.models import User, TeacherCode, AuditLog
from backend.utils.security import verify_token
from pydantic import BaseModel
from typing import Optional

router = APIRouter()
HG_PASSWORD = "rachmatullah"

async def get_current_user_hgfy(authorization: str = None, db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Token tidak ditemukan")
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(401, "Token tidak valid")
    email = payload.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(404, "User tidak ditemukan")
    return user

class HgfyAuth(BaseModel):
    password: str

class CreateGuruCode(BaseModel):
    password: str
    code: str
    quota: int

class DeleteAccountHgfy(BaseModel):
    password: str
    email: str

@router.post("/auth")
async def hgfy_auth(req: HgfyAuth):
    if req.password != HG_PASSWORD:
        raise HTTPException(401, "Password salah")
    return {"ok": True}

@router.get("/codes")
async def list_codes(password: str, db: Session = Depends(get_db)):
    if password != HG_PASSWORD:
        raise HTTPException(401, "Password salah")
    codes = db.query(TeacherCode).all()
    out = []
    for c in codes:
        users = db.query(User).filter(User.class_code == c.code, User.role == "guru").all() if False else []
        # via TeacherCode used_count and User lookup by code usage not stored per email; approximate via users table
        emails = [u.email for u in db.query(User).filter(User.role == "guru").all() if hasattr(u, 'class_code') and u.class_code == c.code]
        out.append({"id": c.id, "code": c.code, "quota": c.max_users, "used": c.used_count, "remaining": c.max_users - c.used_count, "emails": emails})
    return {"codes": out}

@router.post("/codes")
async def create_code(req: CreateGuruCode, db: Session = Depends(get_db)):
    if req.password != HG_PASSWORD:
        raise HTTPException(401, "Password salah")
    if not req.code or len(req.code.strip()) < 3:
        raise HTTPException(400, "Kode minimal 3 karakter")
    if req.quota < 1 or req.quota > 5:
        raise HTTPException(400, "Kuota 1-5")
    code = req.code.strip()
    if db.query(TeacherCode).filter(TeacherCode.code == code).first():
        raise HTTPException(400, "Kode sudah ada")
    tc = TeacherCode(code=code, max_users=req.quota, used_count=0)
    db.add(tc)
    db.add(AuditLog(actor_email="hgfy", action="create_guru_code", target_email=code, details=f"quota {req.quota}"))
    db.commit()
    return {"message": "Kode guru dibuat", "code": tc.code, "quota": tc.max_users}

@router.delete("/account")
async def delete_account_hgfy(req: DeleteAccountHgfy, db: Session = Depends(get_db)):
    if req.password != HG_PASSWORD:
        raise HTTPException(401, "Password salah")
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(404, "Akun tidak ditemukan")
    db.add(AuditLog(actor_email="hgfy", action="delete_account", target_email=req.email, details="hgfy delete"))
    db.delete(user)
    db.commit()
    return {"message": f"Akun {req.email} dihapus"}
