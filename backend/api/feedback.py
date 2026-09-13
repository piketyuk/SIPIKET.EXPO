from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.models.database import get_db
from backend.models.models import Feedback
from backend.utils.security import verify_token, sanitize_input
from pydantic import BaseModel, EmailStr
from datetime import datetime

router = APIRouter()

async def get_current_user(authorization: str = None, db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    if not payload:
        return None
    email = payload.get("sub")
    user = db.query(User).filter(User.email == email).first()
    return user

class FeedbackRequest(BaseModel):
    email: EmailStr
    nama: str
    kategori: str
    rating: int
    pesan: str

@router.post("/")
async def create_feedback(req: FeedbackRequest, db: Session = Depends(get_db)):
    if req.kategori not in ["Saran", "Bug", "Pujian"]:
        raise HTTPException(status_code=400, detail="Kategori tidak valid")
    if not (1 <= req.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating 1-5")
    nama = sanitize_input(req.nama, 100)
    pesan = sanitize_input(req.pesan, 1000)
    if not nama or not pesan:
        raise HTTPException(status_code=400, detail="Nama dan pesan tidak valid")
    if len(pesan) < 10:
        raise HTTPException(status_code=400, detail="Pesan minimal 10 karakter")
    feedback = Feedback(email=req.email, nama=nama, kategori=req.kategori, rating=req.rating, pesan=pesan)
    db.add(feedback)
    db.commit()
    return {"message": "Feedback berhasil dikirim. Terima kasih!", "feedback_id": feedback.id}

@router.get("/")
async def get_feedbacks(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user or current_user.email != "admin@sipiket.my.id":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    feedbacks = db.query(Feedback).all()
    result = []
    for fb in feedbacks:
        result.append({"id": fb.id, "email": fb.email, "nama": fb.nama, "kategori": fb.kategori, "rating": fb.rating, "pesan": fb.pesan, "created_at": fb.created_at})
    return {"feedbacks": result}
