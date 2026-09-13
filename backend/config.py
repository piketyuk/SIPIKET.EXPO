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
    GMAIL_ADDRESS: str = "sipiket.co@gmail.com"
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
