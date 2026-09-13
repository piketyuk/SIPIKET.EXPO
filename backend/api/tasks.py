from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.models.database import get_db
from backend.models.models import User, Task, Class, Regu, Video
from backend.utils.security import verify_token, sanitize_input
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
import random

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

class CreateTaskRequest(BaseModel):
    class_code: str
    title: str
    description: Optional[str] = None

@router.post("/")
async def create_task(req: CreateTaskRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "guru":
        raise HTTPException(status_code=403, detail="Hanya guru yang bisa membuat tugas")
    cls = db.query(Class).filter(Class.code == req.class_code).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")
    if cls.created_by != current_user.email:
        raise HTTPException(status_code=403, detail="Hanya guru pembuat kelas")
    title = sanitize_input(req.title, 200)
    description = sanitize_input(req.description or "", 1000)
    if not title:
        raise HTTPException(status_code=400, detail="Judul tugas tidak valid")
    new_task = Task(class_code=req.class_code, title=title, description=description, created_by=current_user.email)
    db.add(new_task)
    db.commit()
    return {"message": "Tugas berhasil dibuat", "task": {"id": new_task.id, "title": new_task.title, "description": new_task.description, "created_at": new_task.created_at}}

@router.get("/{class_code}")
async def get_tasks(class_code: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cls = db.query(Class).filter(Class.code == class_code).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")
    if current_user.role == "siswa":
        from backend.models.models import Enrollment
        enrollment = db.query(Enrollment).filter(Enrollment.user_id == current_user.id, Enrollment.class_code == class_code).first()
        if not enrollment:
            raise HTTPException(status_code=403, detail="Akses ditolak")
    tasks = db.query(Task).filter(Task.class_code == class_code).all()
    result = []
    for task in tasks:
        result.append({"id": task.id, "title": task.title, "description": task.description, "created_by": task.created_by, "created_at": task.created_at})
    return {"tasks": result}

@router.post("/distribute")
async def distribute_tasks(class_code: str, day: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "guru":
        raise HTTPException(status_code=403, detail="Hanya guru")
    cls = db.query(Class).filter(Class.code == class_code).first()
    if not cls or cls.created_by != current_user.email:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    regu = db.query(Regu).filter(Regu.class_code == class_code, Regu.day == day).first()
    if not regu:
        raise HTTPException(status_code=404, detail="Regu tidak ditemukan")
    tasks = db.query(Task).filter(Task.class_code == class_code).all()
    if not tasks:
        raise HTTPException(status_code=400, detail="Tidak ada tugas")
    shuffled_tasks = tasks.copy()
    random.shuffle(shuffled_tasks)
    members = regu.members
    assignments = []
    for i, member in enumerate(members):
        task_idx = i % len(shuffled_tasks)
        assignments.append({"member_email": member.email, "task_id": shuffled_tasks[task_idx].id, "task_title": shuffled_tasks[task_idx].title})
    return {"message": f"Tugas didistribusi ke regu {day}", "assignments": assignments}

@router.delete("/{task_id}")
async def delete_task(task_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tugas tidak ditemukan")
    if task.created_by != current_user.email:
        raise HTTPException(status_code=403, detail="Hanya pembuat tugas")
    db.delete(task)
    db.commit()
    return {"message": "Tugas berhasil dihapus"}

@router.get("/{task_id}/submissions")
async def get_submissions(task_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tugas tidak ditemukan")
    if task.created_by != current_user.email:
        raise HTTPException(status_code=403, detail="Hanya guru pembuat")
    videos = db.query(Video).filter(Video.task_id == task_id).all()
    submissions = []
    for video in videos:
        uploader = db.query(User).filter(User.email == video.uploader_email).first()
        submissions.append({"video_id": video.id, "uploader_name": uploader.display_name if uploader else "Unknown", "uploader_email": video.uploader_email, "storage_url": video.storage_path, "duration": video.duration_seconds, "recorded_at": video.recorded_at, "verified": video.verified})
    return {"submissions": submissions}
