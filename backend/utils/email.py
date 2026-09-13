import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from backend.config import settings
from typing import Optional

class EmailService:
    def __init__(self):
        self.sender_email = settings.GMAIL_ADDRESS
        self.sender_password = settings.GMAIL_APP_PASSWORD
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
    
    def send_otp_email(self, to_email: str, otp: str, name: str = None) -> bool:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"SIPIKET OTP {otp} — verifikasi"
            msg["From"] = f"SIPIKET.EXPO <{self.sender_email}>"
            msg["To"] = to_email
            
            name = name or to_email
            html = f"""<div style="font-family:Inter,system-ui;padding:24px;max-width:520px;margin:auto;border:1px solid #d4e7ff;border-radius:16px;background:#0a0e27">
                <div style="display:flex;align-items:center;gap:10px">
                    <div style="width:44px;height:44px;border-radius:50%;background:#0f5bff;color:#fff;display:grid;place-items:center;font-weight:800">S</div>
                    <b style="color:#fff">SIPIKET.EXPO</b>
                </div>
                <h2 style="margin:16px 0 8px;color:#fff">Verifikasi Email Kamu</h2>
                <p style="color:#9ca3af">Halo {name}, kode OTP Anda:</p>
                <div style="background:#1e293b;padding:16px;border-radius:8px;text-align:center;margin:12px 0">
                    <b style="font-size:28px;color:#0f5bff;letter-spacing:4px">{otp}</b>
                </div>
                <p style="font-size:12px;color:#6b7280">Kode berlaku 1 menit. Jangan bagikan kode ini kepada siapa pun.</p>
            </div>"""
            part = MIMEText(html, "html")
            msg.attach(part)
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=8) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.send_message(msg)
            
            return True
        except Exception as e:
            print(f"Email OTP gagal: {e}")
            return False
    
    def send_verification_email(self, to_email: str, verification_link: str, name: str = None) -> bool:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "Verifikasi Login SIPIKET"
            msg["From"] = f"SIPIKET.EXPO <{self.sender_email}>"
            msg["To"] = to_email
            
            name = name or to_email
            html = f"""<div style="font-family:Inter,system-ui;padding:24px;max-width:520px;margin:auto;border:1px solid #d4e7ff;border-radius:16px;background:#0a0e27">
                <div style="display:flex;align-items:center;gap:10px">
                    <div style="width:44px;height:44px;border-radius:50%;background:#0f5bff;color:#fff;display:grid;place-items:center;font-weight:800">S</div>
                    <b style="color:#fff">SIPIKET.EXPO</b>
                </div>
                <h2 style="margin:16px 0 8px;color:#fff">Verifikasi Login Kamu</h2>
                <p style="color:#9ca3af">Halo {name}, klik tombol di bawah untuk verifikasi login Anda.</p>
                <a href="{verification_link}" style="display:inline-block;background:#0f5bff;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700;margin:12px 0">Verifikasi Login →</a>
                <p style="font-size:12px;color:#6b7280">Tautan berlaku 24 jam. Jika ini bukan aksi Anda, abaikan email ini.</p>
            </div>"""
            part = MIMEText(html, "html")
            msg.attach(part)
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=8) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.send_message(msg)
            
            return True
        except Exception as e:
            print(f"Email verifikasi gagal: {e}")
            return False

email_service = EmailService()
