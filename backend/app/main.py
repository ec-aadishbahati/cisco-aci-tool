from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List, Dict, Any
import json
import os
from pathlib import Path

from .modules.fault_analysis.analyzer import FaultAnalyzer
from .models.fabric import FabricData, FaultSummary
from .database.manager import DatabaseManager

app = FastAPI(
    title="Cisco ACI Tool API",
    description="Backend API for Cisco ACI fault analysis and configuration management",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "tauri://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db_manager = DatabaseManager()
fault_analyzer = FaultAnalyzer()

@app.on_event("startup")
async def startup_event():
    await db_manager.initialize()

@app.get("/")
async def root():
    return {"message": "Cisco ACI Tool API", "version": "0.1.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}

@app.post("/api/fabrics/upload")
async def upload_fabric_data(
    fabric_name: str,
    files: List[UploadFile] = File(...)
) -> Dict[str, Any]:
    """Upload ACI fabric configuration and fault data files"""
    try:
        fabric_data = FabricData(name=fabric_name, files=[])
        
        for file in files:
            if not file.filename.endswith('.json'):
                raise HTTPException(status_code=400, detail=f"File {file.filename} must be JSON")
            
            content = await file.read()
            try:
                json_data = json.loads(content)
                fabric_data.files.append({
                    "filename": file.filename,
                    "data": json_data,
                    "size": len(content)
                })
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail=f"Invalid JSON in file {file.filename}")
        
        fabric_id = await db_manager.store_fabric_data(fabric_data)
        
        return {
            "fabric_id": fabric_id,
            "fabric_name": fabric_name,
            "files_processed": len(files),
            "total_size": sum(f["size"] for f in fabric_data.files)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/fabrics")
async def list_fabrics() -> List[Dict[str, Any]]:
    """List all uploaded fabric configurations"""
    fabrics = await db_manager.get_all_fabrics()
    return fabrics

@app.get("/api/fabrics/{fabric_id}")
async def get_fabric(fabric_id: str) -> Dict[str, Any]:
    """Get specific fabric configuration"""
    fabric = await db_manager.get_fabric(fabric_id)
    if not fabric:
        raise HTTPException(status_code=404, detail="Fabric not found")
    return fabric

@app.post("/api/analysis/faults/{fabric_id}")
async def analyze_faults(fabric_id: str) -> FaultSummary:
    """Analyze faults for a specific fabric"""
    try:
        fabric = await db_manager.get_fabric(fabric_id)
        if not fabric:
            raise HTTPException(status_code=404, detail="Fabric not found")
        
        analysis_result = await fault_analyzer.analyze_fabric_faults(fabric)
        
        await db_manager.store_analysis_result(fabric_id, "fault_analysis", analysis_result)
        
        return analysis_result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analysis/faults/{fabric_id}/summary")
async def get_fault_summary(fabric_id: str) -> Dict[str, Any]:
    """Get fault analysis summary for a fabric"""
    try:
        summary = await db_manager.get_analysis_result(fabric_id, "fault_analysis")
        if not summary:
            raise HTTPException(status_code=404, detail="No fault analysis found for this fabric")
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analysis/compare")
async def compare_fabrics(fabric_ids: List[str]) -> Dict[str, Any]:
    """Compare multiple fabrics"""
    try:
        if len(fabric_ids) < 2:
            raise HTTPException(status_code=400, detail="At least 2 fabrics required for comparison")
        
        fabrics = []
        for fabric_id in fabric_ids:
            fabric = await db_manager.get_fabric(fabric_id)
            if not fabric:
                raise HTTPException(status_code=404, detail=f"Fabric {fabric_id} not found")
            fabrics.append(fabric)
        
        comparison_result = await fault_analyzer.compare_fabrics(fabrics)
        
        return comparison_result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/fabrics/{fabric_id}")
async def delete_fabric(fabric_id: str) -> Dict[str, str]:
    """Delete a fabric and its analysis results"""
    try:
        success = await db_manager.delete_fabric(fabric_id)
        if not success:
            raise HTTPException(status_code=404, detail="Fabric not found")
        return {"message": "Fabric deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
