try:
    from pydantic_settings import BaseSettings
    class Settings(BaseSettings):
        DATABASE_URL: str = "postgresql://user:password@localhost/sipiket"
        REDIS_URL: str = "redis://localhost:6379"
        SECRET_KEY: str = "your-secret-key-change-in-production"
        ALGORITHM: str = "HS256"
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
        REFRESH_TOKEN_EXPIRE_DAYS: int = 7
        GOOGLE_CLIENT_ID: str = ""
        GOOGLE_CLIENT_SECRET: str = ""
        CLOUDINARY_CLOUD_NAME: str = ""
        CLOUDINARY_API_KEY: str = ""
        CLOUDINARY_API_SECRET: str = ""
        GMAIL_ADDRESS: str = "sipiket.anchor@gmail.com"
        GMAIL_APP_PASSWORD: str = ""
        HCAPTCHA_SECRET: str = ""
        FONNTE_TOKEN: str = ""
        FRONTEND_URL: str = "https://sipiket.my.id"
        BACKEND_URL: str = "https://api.sipiket.my.id"
        CORS_ORIGINS: list = ["https://sipiket.my.id", "http://localhost:3000"]
        PASSWORD_MIN_LENGTH: int = 8
        OTP_EXPIRY_MINUTES: int = 1
        RATE_LIMIT_LOGIN: int = 5
        LOCKOUT_MINUTES: int = 15
        VIDEO_MAX_DURATION_SECONDS: int = 15
        VIDEO_MAX_SIZE_MB: int = 50
        class Config:
            env_file = ".env"
            case_sensitive = True
    settings = Settings()
except ImportError:
    import os
    class Settings:
        DATABASE_URL = os.getenv("DATABASE_URL","postgresql://user:password@localhost/sipiket")
        REDIS_URL = os.getenv("REDIS_URL","redis://localhost:6379")
        SECRET_KEY = os.getenv("SECRET_KEY","sipiket-32chars-production-random-2026-change-me")
        ALGORITHM = os.getenv("ALGORITHM","HS256")
        ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES","30"))
        REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS","7"))
        GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID","")
        GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET","")
        CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME","")
        CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY","")
        CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET","")
        GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS","sipiket.anchor@gmail.com")
        GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD","")
        HCAPTCHA_SECRET = os.getenv("HCAPTCHA_SECRET","")
        FONNTE_TOKEN = os.getenv("FONNTE_TOKEN","")
        FRONTEND_URL = os.getenv("FRONTEND_URL","https://sipiket.my.id")
        BACKEND_URL = os.getenv("BACKEND_URL","https://api.sipiket.my.id")
        CORS_ORIGINS = ["https://sipiket.my.id"]
        PASSWORD_MIN_LENGTH = 8
        OTP_EXPIRY_MINUTES = 1
        RATE_LIMIT_LOGIN = 5
        LOCKOUT_MINUTES = 15
        VIDEO_MAX_DURATION_SECONDS = 15
        VIDEO_MAX_SIZE_MB = 50
    settings = Settings()
