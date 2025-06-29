import sqlite3
import json
import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime
import aiosqlite
from pathlib import Path

from ..models.fabric import FabricData

class DatabaseManager:
    """Manages local SQLite database for fabric data and analysis results"""
    
    def __init__(self, db_path: str = "aci_tool.db"):
        self.db_path = Path(db_path)
    
    async def initialize(self):
        """Initialize database tables"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS fabrics (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    upload_timestamp DATETIME NOT NULL,
                    file_count INTEGER NOT NULL,
                    total_size INTEGER NOT NULL
                )
            """)
            
            await db.execute("""
                CREATE TABLE IF NOT EXISTS fabric_files (
                    id TEXT PRIMARY KEY,
                    fabric_id TEXT NOT NULL,
                    filename TEXT NOT NULL,
                    data TEXT NOT NULL,
                    size INTEGER NOT NULL,
                    FOREIGN KEY (fabric_id) REFERENCES fabrics (id) ON DELETE CASCADE
                )
            """)
            
            await db.execute("""
                CREATE TABLE IF NOT EXISTS analysis_results (
                    id TEXT PRIMARY KEY,
                    fabric_id TEXT NOT NULL,
                    analysis_type TEXT NOT NULL,
                    result_data TEXT NOT NULL,
                    created_timestamp DATETIME NOT NULL,
                    FOREIGN KEY (fabric_id) REFERENCES fabrics (id) ON DELETE CASCADE
                )
            """)
            
            await db.commit()
    
    async def store_fabric_data(self, fabric_data: FabricData) -> str:
        """Store fabric data and return fabric ID"""
        fabric_id = str(uuid.uuid4())
        timestamp = datetime.now()
        
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT INTO fabrics (id, name, upload_timestamp, file_count, total_size)
                VALUES (?, ?, ?, ?, ?)
            """, (
                fabric_id,
                fabric_data.name,
                timestamp,
                len(fabric_data.files),
                sum(f["size"] for f in fabric_data.files)
            ))
            
            for file_data in fabric_data.files:
                file_id = str(uuid.uuid4())
                await db.execute("""
                    INSERT INTO fabric_files (id, fabric_id, filename, data, size)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    file_id,
                    fabric_id,
                    file_data["filename"],
                    json.dumps(file_data["data"]),
                    file_data["size"]
                ))
            
            await db.commit()
        
        return fabric_id
    
    async def get_fabric(self, fabric_id: str) -> Optional[Dict[str, Any]]:
        """Get fabric data by ID"""
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute("""
                SELECT id, name, upload_timestamp, file_count, total_size
                FROM fabrics WHERE id = ?
            """, (fabric_id,)) as cursor:
                fabric_row = await cursor.fetchone()
                
                if not fabric_row:
                    return None
            
            files = []
            async with db.execute("""
                SELECT filename, data, size FROM fabric_files WHERE fabric_id = ?
            """, (fabric_id,)) as cursor:
                async for row in cursor:
                    files.append({
                        "filename": row[0],
                        "data": json.loads(row[1]),
                        "size": row[2]
                    })
            
            return {
                "id": fabric_row[0],
                "name": fabric_row[1],
                "upload_timestamp": fabric_row[2],
                "file_count": fabric_row[3],
                "total_size": fabric_row[4],
                "files": files
            }
    
    async def get_all_fabrics(self) -> List[Dict[str, Any]]:
        """Get all fabric metadata (without file data)"""
        fabrics = []
        
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute("""
                SELECT id, name, upload_timestamp, file_count, total_size
                FROM fabrics ORDER BY upload_timestamp DESC
            """) as cursor:
                async for row in cursor:
                    fabrics.append({
                        "id": row[0],
                        "name": row[1],
                        "upload_timestamp": row[2],
                        "file_count": row[3],
                        "total_size": row[4]
                    })
        
        return fabrics
    
    async def delete_fabric(self, fabric_id: str) -> bool:
        """Delete fabric and all associated data"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("DELETE FROM fabrics WHERE id = ?", (fabric_id,))
            await db.commit()
            return cursor.rowcount > 0
    
    async def store_analysis_result(self, fabric_id: str, analysis_type: str, result_data: Any) -> str:
        """Store analysis result"""
        result_id = str(uuid.uuid4())
        timestamp = datetime.now()
        
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT INTO analysis_results (id, fabric_id, analysis_type, result_data, created_timestamp)
                VALUES (?, ?, ?, ?, ?)
            """, (
                result_id,
                fabric_id,
                analysis_type,
                json.dumps(result_data, default=str),
                timestamp
            ))
            await db.commit()
        
        return result_id
    
    async def get_analysis_result(self, fabric_id: str, analysis_type: str) -> Optional[Dict[str, Any]]:
        """Get latest analysis result for fabric and type"""
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute("""
                SELECT result_data FROM analysis_results 
                WHERE fabric_id = ? AND analysis_type = ?
                ORDER BY created_timestamp DESC LIMIT 1
            """, (fabric_id, analysis_type)) as cursor:
                row = await cursor.fetchone()
                
                if row:
                    return json.loads(row[0])
                return None
