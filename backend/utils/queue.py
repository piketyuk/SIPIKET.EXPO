import json
import asyncio
from datetime import datetime
from typing import Optional

try:
    from backend.utils.cache import redis_client
except:
    redis_client = None

QUEUE_KEY = "video:queue"
PEAK_START = 10
PEAK_END = 17

def is_peak_hours(now: Optional[datetime] = None) -> bool:
    h = (now or datetime.now()).hour
    return PEAK_START <= h < PEAK_END

def enqueue_video(payload: dict) -> int:
    if not redis_client:
        return 0
    return redis_client.lpush(QUEUE_KEY, json.dumps(payload))

def dequeue_video(timeout: int = 0):
    if not redis_client:
        return None
    res = redis_client.brpop(QUEUE_KEY, timeout=timeout)
    if not res:
        return None
    _, data = res
    return json.loads(data)

def queue_length() -> int:
    if not redis_client:
        return 0
    return redis_client.llen(QUEUE_KEY)

async def process_queue(video_service, db_factory):
    while True:
        item = dequeue_video(timeout=5)
        if not item:
            await asyncio.sleep(1)
            continue
        try:
            from backend.models.database import SessionLocal
            from backend.models.models import Video
            db = SessionLocal()
            url = video_service.upload_video(item["tmp_path"], item["email"], item["class_code"])
            if url:
                v = Video(class_code=item["class_code"], task_id=item.get("task_id"), uploader_email=item["email"], storage_path=url, duration_seconds=item["duration"])
                db.add(v)
                db.commit()
            db.close()
        except Exception as e:
            print(f"[queue] failed {e}")
            enqueue_video(item)
            await asyncio.sleep(2)
