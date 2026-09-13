import redis
from backend.config import settings
from datetime import datetime, timedelta
from typing import Optional

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

class RateLimiter:
    def __init__(self, redis_conn=redis_client):
        self.redis = redis_conn
    
    def is_allowed(self, key: str, max_attempts: int, window_seconds: int = 900) -> bool:
        current = self.redis.get(key)
        if current is None:
            self.redis.setex(key, window_seconds, 1)
            return True
        count = int(current)
        if count < max_attempts:
            self.redis.incr(key)
            return True
        return False
    
    def get_remaining(self, key: str, max_attempts: int) -> int:
        current = self.redis.get(key)
        if current is None:
            return max_attempts
        return max(0, max_attempts - int(current))
    
    def reset(self, key: str):
        self.redis.delete(key)

class LoginLockout:
    def __init__(self, redis_conn=redis_client):
        self.redis = redis_conn
        self.lockout_window = settings.RATE_LIMIT_LOGIN
        self.lockout_duration = settings.LOCKOUT_MINUTES * 60
    
    def check_lockout(self, email: str) -> bool:
        key = f"lockout:{email}"
        return self.redis.exists(key)
    
    def record_failed_attempt(self, email: str):
        key = f"failed:{email}"
        current = self.redis.get(key)
        if current is None:
            self.redis.setex(key, self.lockout_duration, 1)
        else:
            count = int(current) + 1
            self.redis.setex(key, self.lockout_duration, count)
            if count >= self.lockout_window:
                self.redis.setex(f"lockout:{email}", self.lockout_duration, 1)
    
    def reset_attempts(self, email: str):
        self.redis.delete(f"failed:{email}")

class SessionCache:
    def __init__(self, redis_conn=redis_client):
        self.redis = redis_conn
    
    def set_otp(self, email: str, otp: str, expires_minutes: int = 1):
        key = f"otp:{email}"
        self.redis.setex(key, expires_minutes * 60, otp)
    
    def get_otp(self, email: str) -> Optional[str]:
        key = f"otp:{email}"
        return self.redis.get(key)
    
    def verify_otp(self, email: str, otp: str) -> bool:
        cached = self.get_otp(email)
        if cached and cached == otp:
            self.redis.delete(f"otp:{email}")
            return True
        return False
    
    def set_verification_token(self, email: str, token: str, expires_hours: int = 24):
        key = f"verify:{email}"
        self.redis.setex(key, expires_hours * 3600, token)
    
    def get_verification_token(self, email: str) -> Optional[str]:
        key = f"verify:{email}"
        return self.redis.get(key)
    
    def invalidate_token(self, email: str):
        self.redis.delete(f"verify:{email}")

rate_limiter = RateLimiter()
login_lockout = LoginLockout()
session_cache = SessionCache()
