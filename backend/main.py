
import asyncio
from contextlib import asynccontextmanager
async def purge_stale():
    try:
        from backend.models.database import SessionLocal
        from backend.models.models import User
        from datetime import datetime, timedelta
        while True:
            try:
                db = SessionLocal()
                cutoff = datetime.utcnow() - timedelta(hours=24)
                stale = db.query(User).filter(User.class_code==None, User.registered_at < cutoff, User.role=='siswa').all()
                for u in stale: db.delete(u)
                now = datetime.utcnow()
                pending = db.query(User).filter(User.is_blacklisted==True, User.blacklist_until != None, User.blacklist_until < now).all()
                for u in pending: db.delete(u)
                db.commit()
                db.close()
            except Exception as e:
                print(f"[purge] {e}")
            await asyncio.sleep(3600)
    except asyncio.CancelledError:
        pass
@asynccontextmanager
async def lifespan(app):
    import os
    backend_url = os.getenv("BACKEND_URL", "")
    async def keep_alive():
        import httpx
        while True:
            await asyncio.sleep(600)
            if backend_url:
                try:
                    async with httpx.AsyncClient(timeout=5) as c:
                        await c.get(backend_url + "/health")
                except: pass
    tasks = [asyncio.create_task(purge_stale())]
    if backend_url:
        tasks.append(asyncio.create_task(keep_alive()))
    try:
        from backend.utils.queue import process_queue
        from backend.utils.video import video_service
        tasks.append(asyncio.create_task(process_queue(video_service, None)))
    except: pass
    yield
    for t in tasks: t.cancel()
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from backend.config import settings
from backend.models.database import init_db
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
app = FastAPI(title="SIPIKET API", version="1.0.0", lifespan=lifespan)
init_db()
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["sipiket.my.id", "*.sipiket.my.id", "localhost", "127.0.0.1", "testserver", "piket.pythonanywhere.com", "*.vercel.app"])
app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS+["https://sipiketexpo-lyart.vercel.app","https://sipiket.my.id","https://piket.pythonanywhere.com"], allow_credentials=True, allow_methods=["GET","POST","PUT","DELETE"], allow_headers=["*"])
@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}
@app.get("/")
async def root():
    return {"status": "ok", "app": "Sipiket"}
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(status_code=500, content={"error": "Internal server error"})
def safe_include(module_path, prefix, tag):
    try:
        import importlib
        mod = importlib.import_module(module_path)
        app.include_router(mod.router, prefix=prefix, tags=[tag])
        logger.info(f"Router {tag} loaded")
    except Exception as e:
        logger.warning(f"Router {tag} skipped: {e}")
safe_include("backend.api.auth", "/api/auth", "auth")
safe_include("backend.api.users", "/api/users", "users")
safe_include("backend.api.classes", "/api/classes", "classes")
safe_include("backend.api.tasks", "/api/tasks", "tasks")
safe_include("backend.api.videos", "/api/videos", "videos")
safe_include("backend.api.reports", "/api/reports", "reports")
safe_include("backend.api.feedback", "/api/feedback", "feedback")
safe_include("backend.api.notifications", "/api/notifications", "notifications")
safe_include("backend.api.aliases", "/api/aliases", "aliases")
safe_include("backend.api.hgfy", "/api/hgfy", "hgfy")
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
