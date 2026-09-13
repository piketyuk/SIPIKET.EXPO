try:
    import cloudinary
    import cloudinary.uploader
    from backend.config import settings
    cloudinary.config(cloud_name=settings.CLOUDINARY_CLOUD_NAME, api_key=settings.CLOUDINARY_API_KEY, api_secret=settings.CLOUDINARY_API_SECRET)
    _has_cloudinary=True
except Exception:
    _has_cloudinary=False
    settings=None

class VideoService:
    MAX_DURATION = 15
    MAX_SIZE = 50*1024*1024
    @staticmethod
    def validate_video(file_path: str, duration_seconds: int):
        if duration_seconds > 15: return False, f"Video maksimal 15 detik"
        if duration_seconds < 1: return False, "Video minimal 1 detik"
        import os
        if os.path.getsize(file_path) > 50*1024*1024: return False, f"File maksimal 50MB"
        return True, "OK"
    @staticmethod
    def upload_video(file_path: str, email: str, class_code: str):
        if not _has_cloudinary: return f"https://example.com/sipiket/{class_code}/{email}/demo.mp4"
        try:
            from backend.utils.security import hash_video_filename
            import os
            filename = hash_video_filename(os.path.basename(file_path))
            public_id = f"sipiket/{class_code}/{email}/{filename}"
            result = cloudinary.uploader.upload_large(file_path, resource_type="video", public_id=public_id, folder="sipiket", overwrite=False, format="mp4")
            return result.get("secure_url")
        except Exception as e:
            print(f"Upload gagal: {e}")
            return None
    @staticmethod
    def delete_video(public_id: str) -> bool:
        if not _has_cloudinary: return True
        try: cloudinary.uploader.destroy(public_id, resource_type="video"); return True
        except: return False
    @staticmethod
    def upload_image(file_path: str, email: str):
        if not _has_cloudinary: return f"https://example.com/avatar/{email}/demo.jpg"
        try:
            from backend.utils.security import hash_video_filename
            import os
            filename = hash_video_filename(os.path.basename(file_path))
            public_id = f"sipiket/avatars/{email}/{filename}"
            result = cloudinary.uploader.upload(file_path, public_id=public_id, folder="sipiket/avatars", overwrite=False, transformation=[{"width": 300, "height": 300, "crop": "fill"}])
            return result.get("secure_url")
        except Exception as e:
            print(f"Upload foto gagal: {e}")
            return None
video_service = VideoService()
