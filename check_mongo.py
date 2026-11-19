import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "hanif_portfolio")

async def check_collections():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Get stats for each collection
    collections = await db.list_collection_names()
    for coll_name in collections:
        stats = await db.command("collStats", coll_name)
        size_mb = stats.get("size", 0) / (1024*1024)
        storage_mb = stats.get("storageSize", 0) / (1024*1024)
        count = stats.get("count", 0)
        print(f"{coll_name:30s}  docs: {count:6d}  size: {size_mb:6.2f} MB  storage: {storage_mb:6.2f} MB")
    
    # Total
    db_stats = await db.command("dbStats")
    print(f"\nTotal DB: {db_stats.get('dataSize',0)/(1024*1024):.2f} MB data, {db_stats.get('storageSize',0)/(1024*1024):.2f} MB storage")
    
    client.close()

asyncio.run(check_collections())
