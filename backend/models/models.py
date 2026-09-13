from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, Enum, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid
import enum

Base = declarative_base()

class RoleEnum(str, enum.Enum):
    siswa = "siswa"
    guru = "guru"

class ContextEnum(str, enum.Enum):
    coret = "coret"
    laporkan = "laporkan"

class NotifContextEnum(str, enum.Enum):
    hukuman = "hukuman"
    pelanggaran_berat = "pelanggaran_berat"

regu_siswa = Table('regu_siswa', Base.metadata,
    Column('regu_id', String, ForeignKey('regu.id')),
    Column('user_id', String, ForeignKey('users.id'))
)

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    display_name = Column(String, nullable=False)
    nickname = Column(String, nullable=True)
    password_hash = Column(String, nullable=True)
    google_sub = Column(String, unique=True, nullable=True)
    role = Column(Enum(RoleEnum), nullable=False)
    avatar_url = Column(String, nullable=True)
    class_code = Column(String, ForeignKey('classes.code'), nullable=True)
    registered_at = Column(DateTime, default=datetime.utcnow)
    profile_updated_at = Column(DateTime, nullable=True)
    last_login_at = Column(DateTime, nullable=True)
    last_password_change = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    is_blacklisted = Column(Boolean, default=False)
    blacklist_until = Column(DateTime, nullable=True)

class Class(Base):
    __tablename__ = "classes"
    code = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    theme = Column(String, default="dark")
    max_students = Column(Integer, default=40)
    created_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class Enrollment(Base):
    __tablename__ = "enrollments"
    user_id = Column(String, ForeignKey('users.id'), primary_key=True)
    class_code = Column(String, ForeignKey('classes.code'), primary_key=True)
    joined_at = Column(DateTime, default=datetime.utcnow)

class Regu(Base):
    __tablename__ = "regu"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    class_code = Column(String, ForeignKey('classes.code'))
    day = Column(String)
    notification_template = Column(Text, nullable=True)

class Task(Base):
    __tablename__ = "tasks"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    class_code = Column(String, ForeignKey('classes.code'))
    regu_id = Column(String, ForeignKey('regu.id'), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class Video(Base):
    __tablename__ = "videos"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    class_code = Column(String, ForeignKey('classes.code'))
    task_id = Column(String, ForeignKey('tasks.id'), nullable=True)
    uploader_email = Column(String)
    storage_path = Column(String, nullable=False)
    duration_seconds = Column(Integer)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    verified_by = Column(String, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verified = Column(Boolean, default=False)

class Feedback(Base):
    __tablename__ = "feedbacks"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String)
    nama = Column(String)
    kategori = Column(String)
    rating = Column(Integer)
    pesan = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class Report(Base):
    __tablename__ = "reports"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    class_code = Column(String, ForeignKey('classes.code'))
    reporter_email = Column(String)
    reported_email = Column(String)
    context = Column(Enum(ContextEnum))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_email = Column(String)
    action = Column(String)
    target_email = Column(String, nullable=True)
    details = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class OTPSession(Base):
    __tablename__ = "otp_sessions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, nullable=False, index=True)
    otp_code = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class TeacherCode(Base):
    __tablename__ = "teacher_codes"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String, unique=True, nullable=False)
    max_users = Column(Integer, default=1)
    used_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class Webhook(Base):
    __tablename__ = "webhooks"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    class_code = Column(String, ForeignKey('classes.code'))
    url = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class NotificationTemplate(Base):
    __tablename__ = "notification_templates"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    class_code = Column(String, ForeignKey('classes.code'))
    context = Column(Enum(NotifContextEnum))
    message = Column(Text, nullable=False)
    created_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class StudentAlias(Base):
    __tablename__ = "student_aliases"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    class_code = Column(String, ForeignKey('classes.code'))
    guru_email = Column(String)
    siswa_email = Column(String)
    alias = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
