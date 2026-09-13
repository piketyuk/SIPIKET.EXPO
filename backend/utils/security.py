from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional
from backend.config import settings
import hashlib
import secrets

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

def hash_video_filename(original_name: str) -> str:
    return hashlib.sha256(f"{original_name}{secrets.token_hex(8)}".encode()).hexdigest()[:16]

def sanitize_input(text: str, max_length: int = 1000) -> str:
    if not text:
        return ""
    text = text.strip()[:max_length]
    for char in ["<", ">", "\"", "'", ";", "javascript:", "onclick", "onerror"]:
        text = text.replace(char, "")
    return text

def validate_password(password: str) -> tuple:
    if len(password) < settings.PASSWORD_MIN_LENGTH:
        return False, f"Password minimal {settings.PASSWORD_MIN_LENGTH} karakter"
    if not any(c.isupper() for c in password):
        return False, "Password harus mengandung huruf besar"
    if not any(c.isdigit() for c in password):
        return False, "Password harus mengandung angka"
    return True, "OK"

def generate_otp() -> str:
    return "".join([str(secrets.randbelow(10)) for _ in range(6)])
