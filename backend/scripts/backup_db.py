"""Backup MongoDB ke direktori .bson yang bisa dipulihkan dengan mongorestore.

Usage:
    python scripts/backup_db.py --target "mongodb+srv://.../" --out ../backups

Jika --target tidak diisi, MONGO_URL dari backend/.env dipakai.
Folder hasil: <out>/<timestamp>/<nama_database>/<koleksi>.bson

Pulihkan dengan:
    mongorestore --uri "<uri>" --drop <out>/<timestamp>
"""

import argparse
import asyncio
import os
import time
from pathlib import Path

from bson import encode
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

SYSTEM_DBS = {"admin", "config", "local"}


async def backup_db(client, db_name: str, out_dir: Path) -> int:
    db = client[db_name]
    target = out_dir / db_name
    target.mkdir(parents=True, exist_ok=True)

    total_docs = 0
    total_bytes = 0
    for collection in await db.list_collection_names():
        path = target / f"{collection}.bson"
        docs = 0
        size = 0
        with open(path, "wb") as handle:
            cursor = db[collection].find({}, batch_size=200)
            batch = []
            async for doc in cursor:
                batch.append(doc)
                if len(batch) >= 200:
                    payload = b"".join(encode(d) for d in batch)
                    handle.write(payload)
                    size += len(payload)
                    docs += len(batch)
                    batch = []
            if batch:
                payload = b"".join(encode(d) for d in batch)
                handle.write(payload)
                size += len(payload)
                docs += len(batch)

        print(f"  {collection:24s} {docs:6d} dok  {size / 1048576:7.2f} MB")
        total_docs += docs
        total_bytes += size

    print(f"  {'TOTAL':24s} {total_docs:6d} dok  {total_bytes / 1048576:7.2f} MB")
    return total_docs


async def run(target: str, out_root: Path) -> Path:
    client = AsyncIOMotorClient(target, serverSelectionTimeoutMS=20000)
    stamp = time.strftime("%Y%m%d-%H%M%S")
    out_dir = out_root / stamp
    out_dir.mkdir(parents=True, exist_ok=True)
    print(f"Backup ke: {out_dir}")

    names = [n for n in await client.list_database_names() if n not in SYSTEM_DBS]
    for name in names:
        print(f"[{name}]")
        await backup_db(client, name, out_dir)

    print("Selesai.")
    return out_dir


def main() -> None:
    parser = argparse.ArgumentParser(description="Backup MongoDB ke .bson (mongorestore-compatible)")
    parser.add_argument("--target", default=os.getenv("TARGET_MONGO_URL") or os.getenv("MONGO_URL", ""))
    parser.add_argument("--out", default=str(ROOT.parent / "backups"))
    args = parser.parse_args()
    if not args.target:
        parser.error("target MongoDB URI wajib diisi (--target, TARGET_MONGO_URL, atau MONGO_URL)")

    asyncio.run(run(args.target, Path(args.out)))


if __name__ == "__main__":
    main()