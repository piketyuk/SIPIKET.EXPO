from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from backend.models.database import get_db
from backend.models.models import User, Video, Task, Class
from backend.utils.security import verify_token
from backend.utils.video import video_service
from backend.config import settings
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

@router.post("/upload")
async def upload_video(file: UploadFile = File(...), class_code: str = None, task_id: Optional[str] = None, duration_seconds: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not class_code or duration_seconds is None:
        raise HTTPException(status_code=400, detail="class_code dan duration_seconds wajib")
    cls = db.query(Class).filter(Class.code == class_code).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")
    if file.content_type not in ["video/mp4", "video/webm", "video/quicktime"]:
        raise HTTPException(status_code=400, detail="Format video tidak didukung (mp4, webm, mov)")
    if file.size > settings.VIDEO_MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Video maksimal {settings.VIDEO_MAX_SIZE_MB}MB")
    if duration_seconds > settings.VIDEO_MAX_DURATION_SECONDS or duration_seconds < 1:
        raise HTTPException(status_code=400, detail=f"Durasi video 1-{settings.VIDEO_MAX_DURATION_SECONDS} detik")
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        valid, msg = video_service.validate_video(tmp_path, duration_seconds)
        if not valid:
            raise HTTPException(status_code=400, detail=msg)
        from backend.utils.queue import is_peak_hours, enqueue_video
        if is_peak_hours():
            enqueue_video({"tmp_path": tmp_path, "email": current_user.email, "class_code": class_code, "task_id": task_id, "duration": duration_seconds})
            video = Video(class_code=class_code, task_id=task_id, uploader_email=current_user.email, storage_path="queued", duration_seconds=duration_seconds)
            db.add(video)
            db.commit()
            return {"message": "Video masuk antrean (jam sibuk 10-17)", "queued": True, "video": {"id": video.id, "duration": video.duration_seconds}}
        url = video_service.upload_video(tmp_path, current_user.email, class_code)
        if not url:
            raise HTTPException(status_code=500, detail="Gagal upload video")
        video = Video(class_code=class_code, task_id=task_id, uploader_email=current_user.email, storage_path=url, duration_seconds=duration_seconds)
        db.add(video)
        db.commit()
        return {"message": "Video berhasil diupload", "video": {"id": video.id, "url": video.storage_path, "duration": video.duration_seconds, "recorded_at": video.recorded_at}}
    finally:
        from backend.utils.queue import is_peak_hours
        if tmp_path and os.path.exists(tmp_path) and not is_peak_hours():
            os.remove(tmp_path)

@router.get("/{video_id}")
async def get_video(video_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video tidak ditemukan")
    if current_user.role == "siswa" and video.uploader_email != current_user.email:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    uploader = db.query(User).filter(User.email == video.uploader_email).first()
    return {"id": video.id, "uploader_name": uploader.display_name if uploader else "Unknown", "uploader_email": video.uploader_email, "url": video.storage_path, "duration": video.duration_seconds, "recorded_at": video.recorded_at, "verified": video.verified, "verified_by": video.verified_by, "verified_at": video.verified_at}

@router.post("/{video_id}/verify")
async def verify_video(video_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "guru":
        raise HTTPException(status_code=403, detail="Hanya guru")
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video tidak ditemukan")
    cls = db.query(Class).filter(Class.code == video.class_code).first()
    if cls.created_by != current_user.email:
        raise HTTPException(status_code=403, detail="Hanya guru pembuat kelas")
    video.verified = True
    video.verified_by = current_user.email
    video.verified_at = datetime.utcnow()
    db.commit()
    return {"message": "Video terverifikasi"}

@router.delete("/{video_id}")
async def delete_video(video_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video tidak ditemukan")
    if current_user.role == "siswa" and video.uploader_email != current_user.email:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    if current_user.role == "guru":
        cls = db.query(Class).filter(Class.code == video.class_code).first()
        if cls.created_by != current_user.email:
            raise HTTPException(status_code=403, detail="Akses ditolak")
    video_service.delete_video(video.storage_path)
    db.delete(video)
    db.commit()
    return {"message": "Video berhasil dihapus"}

@router.get("/{class_code}/history")
async def get_class_history(class_code: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cls = db.query(Class).filter(Class.code == class_code).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")
    videos = db.query(Video).filter(Video.class_code == class_code).all()
    history = []
    for video in videos:
        uploader = db.query(User).filter(User.email == video.uploader_email).first()
        task = db.query(Task).filter(Task.id == video.task_id).first() if video.task_id else None
        history.append({"uploader_name": uploader.display_name if uploader else "Unknown", "task_title": task.title if task else "Tanpa tugas spesifik", "recorded_at": video.recorded_at, "verified": video.verified})
    return {"history": history}
