import os
import subprocess
from datetime import datetime
from pathlib import Path

BACKUP_DIR = Path(os.getenv("BACKUP_DIR", "/tmp/sipiket-backups"))
BACKUP_DIR.mkdir(parents=True, exist_ok=True)

def run_backup(db_url: str = None):
    db_url = db_url or os.getenv("DATABASE_URL", "")
    if not db_url:
        return {"ok": False, "error": "DATABASE_URL not set"}
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    out = BACKUP_DIR / f"sipiket_{ts}.sql.gz"
    try:
        env = os.environ.copy()
        proc = subprocess.run(["pg_dump", db_url], capture_output=True, env=env, timeout=300)
        if proc.returncode != 0:
            return {"ok": False, "error": proc.stderr.decode()[:500]}
        import gzip
        with gzip.open(out, "wb") as f:
            f.write(proc.stdout)
        # keep last 7
        files = sorted(BACKUP_DIR.glob("sipiket_*.sql.gz"))
        for old in files[:-7]:
            old.unlink(missing_ok=True)
        return {"ok": True, "file": str(out), "size": out.stat().st_size}
    except FileNotFoundError:
        return {"ok": False, "error": "pg_dump not found - install postgresql-client"}
    except Exception as e:
        return {"ok": False, "error": str(e)[:500]}

if __name__ == "__main__":
    print(run_backup())
