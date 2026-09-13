import cloudinary
import cloudinary.uploader
from backend.config import settings
from typing import Optional, Tuple
import os

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)

class VideoService:
    MAX_DURATION = settings.VIDEO_MAX_DURATION_SECONDS
    MAX_SIZE = settings.VIDEO_MAX_SIZE_MB * 1024 * 1024
    ALLOWED_FORMATS = ["video/mp4", "video/webm", "video/quicktime"]
    
    @staticmethod
    def validate_video(file_path: str, duration_seconds: int) -> Tuple[bool, str]:
        if duration_seconds > VideoService.MAX_DURATION:
            return False, f"Video maksimal {VideoService.MAX_DURATION} detik"
        if duration_seconds < 1:
            return False, "Video minimal 1 detik"
        if os.path.getsize(file_path) > VideoService.MAX_SIZE:
            return False, f"File maksimal {settings.VIDEO_MAX_SIZE_MB}MB"
        import subprocess, json as _json
        try:
            r = subprocess.run(["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", file_path], capture_output=True, timeout=5)
            if r.returncode == 0:
                info = _json.loads(r.stdout.decode())
                dur = float(info.get("format", {}).get("duration", duration_seconds))
                if dur > VideoService.MAX_DURATION + 0.5:
                    return False, f"Durasi video {dur:.1f}s melebihi {VideoService.MAX_DURATION}s"
                streams = info.get("streams", [])
                vstreams = [s for s in streams if s.get("codec_type") == "video"]
                if not vstreams:
                    return False, "File bukan video valid"
                ctype = vstreams[0].get("codec_name", "")
                if ctype not in ["h264", "vp8", "vp9", "hevc", "avc", "h265", "mpeg4"]:
                    pass
        except FileNotFoundError:
            pass
        except Exception:
            pass
        return True, "OK"
    
    @staticmethod
    def upload_video(file_path: str, email: str, class_code: str) -> Optional[str]:
        try:
            from backend.utils.security import hash_video_filename
            filename = hash_video_filename(os.path.basename(file_path))
            public_id = f"sipiket/{class_code}/{email}/{filename}"
            
            result = cloudinary.uploader.upload_large(
                file_path,
                resource_type="video",
                public_id=public_id,
                folder="sipiket",
                overwrite=False,
                format="mp4"
            )
            return result.get("secure_url")
        except Exception as e:
            print(f"Upload video gagal: {e}")
            return None
    
    @staticmethod
    def delete_video(public_id: str) -> bool:
        try:
            cloudinary.uploader.destroy(public_id, resource_type="video")
            return True
        except Exception as e:
            print(f"Hapus video gagal: {e}")
            return False
    
    @staticmethod
    def upload_image(file_path: str, email: str) -> Optional[str]:
        try:
            from backend.utils.security import hash_video_filename
            filename = hash_video_filename(os.path.basename(file_path))
            public_id = f"sipiket/avatars/{email}/{filename}"
            
            result = cloudinary.uploader.upload(
                file_path,
                public_id=public_id,
                folder="sipiket/avatars",
                overwrite=False,
                transformation=[{"width": 300, "height": 300, "crop": "fill"}]
            )
            return result.get("secure_url")
        except Exception as e:
            print(f"Upload foto gagal: {e}")
            return None

video_service = VideoService()
