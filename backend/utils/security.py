try:
    from passlib.context import CryptContext
    _pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
    def hash_password(p): return _pwd.hash(p)
    def verify_password(a,b):
        try: return _pwd.verify(a,b)
        except: return False
except ImportError:
    import hashlib
    def hash_password(p): return hashlib.sha256(p.encode()).hexdigest()
    def verify_password(a,b): return hashlib.sha256(a.encode()).hexdigest()==b

try:
    from jose import jwt, JWTError
except ImportError:
    import base64, json, hmac, hashlib, time
    class JWTError(Exception): pass
    class jwt:
        @staticmethod
        def encode(d, k, algorithm="HS256"):
            import base64, json, hmac, hashlib, time
            if "exp" not in d: d=dict(d); d["exp"]=int(time.time())+1800
            h=base64.urlsafe_b64encode(json.dumps({"alg":algorithm,"typ":"JWT"}).encode()).decode().rstrip("=")
            p=base64.urlsafe_b64encode(json.dumps(d, default=str).encode()).decode().rstrip("=")
            s=base64.urlsafe_b64encode(hmac.new(k.encode(), f"{h}.{p}".encode(), hashlib.sha256).digest()).decode().rstrip("=")
            return f"{h}.{p}.{s}"
        @staticmethod
        def decode(t,k, algorithms=None):
            import base64, json
            parts=t.split(".")
            if len(parts)!=3: raise JWTError("bad token")
            pad=lambda s: s+"="*(-len(s)%4)
            try: payload=json.loads(base64.urlsafe_b64decode(pad(parts[1])).decode()); return payload
            except Exception as e: raise JWTError(str(e))

from datetime import datetime, timedelta
try:
    from backend.config import settings
except:
    class _S: SECRET_KEY="sipiket-32chars-production-random-2026-change-me"; ALGORITHM="HS256"; ACCESS_TOKEN_EXPIRE_MINUTES=30; REFRESH_TOKEN_EXPIRE_DAYS=7; PASSWORD_MIN_LENGTH=8
    settings=_S()
import hashlib, secrets, os

def create_access_token(data: dict, expires_delta=None):
    to_encode=data.copy()
    expire=datetime.utcnow()+(expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
def create_refresh_token(data: dict):
    to_encode=data.copy()
    expire=datetime.utcnow()+timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type":"refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
def verify_token(token: str):
    try: return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError: return None
def hash_video_filename(n): return hashlib.sha256(f"{n}{secrets.token_hex(8)}".encode()).hexdigest()[:16]
def sanitize_input(text, max_length=1000):
    if not text: return ""
    text=text.strip()[:max_length]
    for c in ["<",">",'"',"'",";","javascript:","onclick","onerror"]: text=text.replace(c,"")
    return text
def validate_password(password: str):
    if len(password) < settings.PASSWORD_MIN_LENGTH: return False, f"Password minimal {settings.PASSWORD_MIN_LENGTH} karakter"
    if not any(c.isupper() for c in password): return False, "Password harus huruf besar"
    if not any(c.isdigit() for c in password): return False, "Password harus angka"
    return True, "OK"
def generate_otp(): return "".join([str(secrets.randbelow(10)) for _ in range(6)])
