from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.models.database import get_db
from backend.models.models import User, Class, Webhook, NotificationTemplate, AuditLog
from backend.utils.security import verify_token, sanitize_input
from backend.config import settings
from pydantic import BaseModel
from typing import Optional
import httpx

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

class WebhookRequest(BaseModel):
    url: str

class TemplateRequest(BaseModel):
    context: str
    message: str

class NotifyRequest(BaseModel):
    context: str
    target_email: str
    message: str
    use_template: Optional[str] = None

@router.post("/{class_code}/webhooks")
async def add_webhook(class_code: str, req: WebhookRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "guru":
        raise HTTPException(status_code=403, detail="Hanya guru")
    cls = db.query(Class).filter(Class.code == class_code).first()
    if not cls or cls.created_by != current_user.email:
        raise HTTPException(status_code=403, detail="Hanya pembuat kelas")
    count = db.query(Webhook).filter(Webhook.class_code == class_code).count()
    if count >= 5:
        raise HTTPException(status_code=400, detail="Maksimal 5 webhook")
    url = req.url.strip()
    if not url.startswith("https://"):
        raise HTTPException(status_code=400, detail="URL harus https://")
    wh = Webhook(class_code=class_code, url=url)
    db.add(wh)
    audit = AuditLog(actor_email=current_user.email, action="add_webhook", target_email=class_code, details=f"Webhook {url}")
    db.add(audit)
    db.commit()
    return {"message": "Webhook ditambahkan", "webhook": {"id": wh.id, "url": wh.url}}

@router.get("/{class_code}/webhooks")
async def list_webhooks(class_code: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cls = db.query(Class).filter(Class.code == class_code).first()
    if not cls or cls.created_by != current_user.email:
        raise HTTPException(status_code=403, detail="Hanya pembuat kelas")
    whs = db.query(Webhook).filter(Webhook.class_code == class_code).all()
    return {"webhooks": [{"id": w.id, "url": w.url, "created_at": w.created_at} for w in whs]}

@router.delete("/{class_code}/webhooks/{webhook_id}")
async def delete_webhook(class_code: str, webhook_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wh = db.query(Webhook).filter(Webhook.id == webhook_id, Webhook.class_code == class_code).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Webhook tidak ditemukan")
    cls = db.query(Class).filter(Class.code == class_code).first()
    if cls.created_by != current_user.email:
        raise HTTPException(status_code=403, detail="Hanya pembuat kelas")
    db.delete(wh)
    db.commit()
    return {"message": "Webhook dihapus"}

@router.post("/{class_code}/templates")
async def create_template(class_code: str, req: TemplateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "guru":
        raise HTTPException(status_code=403, detail="Hanya guru")
    cls = db.query(Class).filter(Class.code == class_code).first()
    if not cls or cls.created_by != current_user.email:
        raise HTTPException(status_code=403, detail="Hanya pembuat kelas")
    if req.context not in ["hukuman", "pelanggaran_berat"]:
        raise HTTPException(status_code=400, detail="Context harus hukuman atau pelanggaran_berat")
    msg = sanitize_input(req.message, 1000)
    if len(msg) < 10:
        raise HTTPException(status_code=400, detail="Pesan minimal 10 karakter")
    tpl = NotificationTemplate(class_code=class_code, context=req.context, message=msg, created_by=current_user.email)
    db.add(tpl)
    db.commit()
    return {"message": "Template disimpan", "template": {"id": tpl.id, "context": tpl.context, "message": tpl.message}}

@router.get("/{class_code}/templates")
async def list_templates(class_code: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tpls = db.query(NotificationTemplate).filter(NotificationTemplate.class_code == class_code).all()
    return {"templates": [{"id": t.id, "context": t.context, "message": t.message} for t in tpls]}

@router.post("/{class_code}/notify")
async def send_notification(class_code: str, req: NotifyRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "guru":
        raise HTTPException(status_code=403, detail="Hanya guru")
    cls = db.query(Class).filter(Class.code == class_code).first()
    if not cls or cls.created_by != current_user.email:
        raise HTTPException(status_code=403, detail="Hanya pembuat kelas")
    if req.context not in ["hukuman", "pelanggaran_berat"]:
        raise HTTPException(status_code=400, detail="Context tidak valid")
    target = db.query(User).filter(User.email == req.target_email).first()
    if not target:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan")
    message = req.message
    if req.use_template:
        tpl = db.query(NotificationTemplate).filter(NotificationTemplate.id == req.use_template).first()
        if tpl:
            message = tpl.message
    message = sanitize_input(message, 1000)
    whs = db.query(Webhook).filter(Webhook.class_code == class_code).all()
    if not whs:
        raise HTTPException(status_code=400, detail="Belum ada webhook WhatsApp")
    sent = 0
    async with httpx.AsyncClient(timeout=10) as client:
        for wh in whs:
            try:
                await client.post(wh.url, json={"target": req.target_email, "message": f"[{req.context.upper()}] {message}", "class_code": class_code}, headers={"Authorization": f"Bearer {settings.FONNTE_TOKEN}"} if settings.FONNTE_TOKEN else {})
                sent += 1
            except Exception as e:
                print(f"Webhook gagal {wh.url}: {e}")
    audit = AuditLog(actor_email=current_user.email, action="kirim_notifikasi", target_email=req.target_email, details=f"{req.context}: {message[:100]}")
    db.add(audit)
    db.commit()
    return {"message": f"Notifikasi dikirim ke {sent} webhook", "sent": sent}
