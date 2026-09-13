from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.models.database import get_db
from backend.models.models import User, Class, StudentAlias
from backend.utils.security import verify_token, sanitize_input

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

@router.post("/{class_code}/alias")
async def set_alias(class_code: str, siswa_email: str, alias: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "guru":
        raise HTTPException(status_code=403, detail="Hanya guru")
    cls = db.query(Class).filter(Class.code == class_code).first()
    if not cls or cls.created_by != current_user.email:
        raise HTTPException(status_code=403, detail="Hanya pembuat kelas")
    siswa = db.query(User).filter(User.email == siswa_email).first()
    if not siswa:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan")
    alias = sanitize_input(alias, 50)
    if not alias:
        raise HTTPException(status_code=400, detail="Alias tidak valid")
    existing = db.query(StudentAlias).filter(StudentAlias.class_code == class_code, StudentAlias.guru_email == current_user.email, StudentAlias.siswa_email == siswa_email).first()
    if existing:
        existing.alias = alias
    else:
        db.add(StudentAlias(class_code=class_code, guru_email=current_user.email, siswa_email=siswa_email, alias=alias))
    db.commit()
    return {"message": "Nama panggilan disimpan", "alias": alias}

@router.get("/{class_code}/alias")
async def list_aliases(class_code: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    aliases = db.query(StudentAlias).filter(StudentAlias.class_code == class_code).all()
    return {"aliases": [{"siswa_email": a.siswa_email, "alias": a.alias, "guru_email": a.guru_email} for a in aliases]}
