import os
try:
    import redis
    from backend.config import settings
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
except Exception:
    redis_client = None

class RateLimiter:
    _mem={}
    def __init__(self, redis_conn=None): self.redis=redis_client
    def is_allowed(self, key: str, max_attempts: int, window_seconds: int = 900) -> bool:
        if not self.redis:
            import time
            now=time.time()
            v=self._mem.get(key,[])
            v=[t for t in v if now - t < window_seconds]
            if len(v) >= max_attempts: return False
            v.append(now); self._mem[key]=v; return True
        try:
            current = self.redis.get(key)
            if current is None:
                self.redis.setex(key, window_seconds, 1)
                return True
            count = int(current)
            if count < max_attempts:
                self.redis.incr(key)
                return True
            return False
        except: return True
    def get_remaining(self, key: str, max_attempts: int) -> int: return max_attempts
    def reset(self, key: str):
        if self.redis:
            try: self.redis.delete(key)
            except: pass
        self._mem.pop(key,None)

class LoginLockout:
    def __init__(self, redis_conn=None):
        self.redis=redis_client
        try:
            from backend.config import settings as _s
            self.lockout_window=_s.RATE_LIMIT_LOGIN
            self.lockout_duration=_s.LOCKOUT_MINUTES*60
        except: self.lockout_window=5; self.lockout_duration=900
    def check_lockout(self, email: str) -> bool:
        if not self.redis: return False
        try: return bool(self.redis.exists(f"lockout:{email}"))
        except: return False
    def record_failed_attempt(self, email: str): pass
    def reset_attempts(self, email: str): pass

class SessionCache:
    _mem={}
    def set_otp(self,email,otp,expires_minutes=1):
        import time; self._mem[email]=(otp, time.time()+expires_minutes*60)
    def verify_otp(self,email,otp):
        import time; v=self._mem.get(email)
        if not v: return False
        code,exp=v
        if time.time()>exp: return False
        return code==otp
    def get_otp(self,email): return self._mem.get(email, (None,0))[0]

rate_limiter = RateLimiter()
login_lockout = LoginLockout()
session_cache = SessionCache()
try: redis_client
except: redis_client=None
