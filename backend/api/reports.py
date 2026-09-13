from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.models.database import get_db
from backend.models.models import User, Report, Class
from backend.utils.security import verify_token, sanitize_input
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

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

class CreateReportRequest(BaseModel):
    class_code: str
    reported_email: str
    context: str
    notes: str

@router.post("/")
async def create_report(req: CreateReportRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if req.context not in ["coret", "laporkan"]:
        raise HTTPException(status_code=400, detail="Context tidak valid")
    cls = db.query(Class).filter(Class.code == req.class_code).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")
    reported = db.query(User).filter(User.email == req.reported_email).first()
    if not reported:
        raise HTTPException(status_code=404, detail="User yang dilaporkan tidak ditemukan")
    notes = sanitize_input(req.notes, 500)
    report = Report(class_code=req.class_code, reporter_email=current_user.email, reported_email=req.reported_email, context=req.context, notes=notes)
    db.add(report)
    db.commit()
    return {"message": "Laporan berhasil dibuat", "report": {"id": report.id, "context": report.context, "created_at": report.created_at}}

@router.get("/{class_code}")
async def get_reports(class_code: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cls = db.query(Class).filter(Class.code == class_code).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")
    if cls.created_by != current_user.email:
        raise HTTPException(status_code=403, detail="Hanya guru pembuat kelas")
    reports = db.query(Report).filter(Report.class_code == class_code).all()
    result = []
    for report in reports:
        reporter = db.query(User).filter(User.email == report.reporter_email).first()
        reported = db.query(User).filter(User.email == report.reported_email).first()
        result.append({"id": report.id, "reporter_name": reporter.display_name if reporter else "Unknown", "reported_name": reported.display_name if reported else "Unknown", "reported_email": report.reported_email, "context": report.context, "notes": report.notes, "created_at": report.created_at})
    return {"reports": result}

@router.delete("/{report_id}")
async def delete_report(report_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")
    cls = db.query(Class).filter(Class.code == report.class_code).first()
    if cls.created_by != current_user.email:
        raise HTTPException(status_code=403, detail="Hanya guru pembuat kelas")
    db.delete(report)
    db.commit()
    return {"message": "Laporan berhasil dihapus"}
