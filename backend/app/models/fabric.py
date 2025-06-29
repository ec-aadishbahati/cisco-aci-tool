from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class FabricFile(BaseModel):
    filename: str
    data: Dict[str, Any]
    size: int

class FabricData(BaseModel):
    name: str
    files: List[Dict[str, Any]]
    upload_timestamp: Optional[datetime] = None
    id: Optional[str] = None

class FaultRecord(BaseModel):
    fault_id: str
    severity: str
    type: str
    description: str
    affected_object: str
    timestamp: datetime
    status: str  # "active", "cleared", "acknowledged"

class FaultSummary(BaseModel):
    fabric_id: str
    fabric_name: str
    total_faults: int
    active_faults: int
    cleared_faults: int
    critical_faults: int
    major_faults: int
    minor_faults: int
    warning_faults: int
    fault_categories: Dict[str, int]
    top_affected_objects: List[Dict[str, Any]]
    fault_timeline: List[Dict[str, Any]]
    analysis_timestamp: datetime

class ComparisonResult(BaseModel):
    fabric_names: List[str]
    common_faults: List[FaultRecord]
    unique_faults: Dict[str, List[FaultRecord]]
    severity_comparison: Dict[str, Dict[str, int]]
    recommendations: List[str]
