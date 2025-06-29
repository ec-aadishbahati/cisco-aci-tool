import json
from typing import Dict, List, Any
from datetime import datetime
import pandas as pd
from collections import defaultdict, Counter

from ...models.fabric import FaultRecord, FaultSummary, ComparisonResult

class FaultAnalyzer:
    """Analyzes ACI fault data and generates insights"""
    
    def __init__(self):
        self.fault_severity_map = {
            "critical": 4,
            "major": 3,
            "minor": 2,
            "warning": 1,
            "info": 0
        }
    
    async def analyze_fabric_faults(self, fabric_data: Dict[str, Any]) -> FaultSummary:
        """Analyze faults for a single fabric"""
        faults = self._extract_faults_from_fabric(fabric_data)
        
        if not faults:
            return FaultSummary(
                fabric_id=fabric_data.get("id", ""),
                fabric_name=fabric_data.get("name", ""),
                total_faults=0,
                active_faults=0,
                cleared_faults=0,
                critical_faults=0,
                major_faults=0,
                minor_faults=0,
                warning_faults=0,
                fault_categories={},
                top_affected_objects=[],
                fault_timeline=[],
                analysis_timestamp=datetime.now()
            )
        
        severity_counts = self._count_by_severity(faults)
        status_counts = self._count_by_status(faults)
        category_counts = self._count_by_category(faults)
        top_objects = self._get_top_affected_objects(faults)
        timeline = self._generate_fault_timeline(faults)
        
        return FaultSummary(
            fabric_id=fabric_data.get("id", ""),
            fabric_name=fabric_data.get("name", ""),
            total_faults=len(faults),
            active_faults=status_counts.get("active", 0),
            cleared_faults=status_counts.get("cleared", 0),
            critical_faults=severity_counts.get("critical", 0),
            major_faults=severity_counts.get("major", 0),
            minor_faults=severity_counts.get("minor", 0),
            warning_faults=severity_counts.get("warning", 0),
            fault_categories=category_counts,
            top_affected_objects=top_objects,
            fault_timeline=timeline,
            analysis_timestamp=datetime.now()
        )
    
    async def compare_fabrics(self, fabrics: List[Dict[str, Any]]) -> ComparisonResult:
        """Compare faults across multiple fabrics"""
        all_fabric_faults = {}
        
        for fabric in fabrics:
            fabric_name = fabric.get("name", "Unknown")
            faults = self._extract_faults_from_fabric(fabric)
            all_fabric_faults[fabric_name] = faults
        
        common_faults = self._find_common_faults(all_fabric_faults)
        unique_faults = self._find_unique_faults(all_fabric_faults)
        
        severity_comparison = {}
        for fabric_name, faults in all_fabric_faults.items():
            severity_comparison[fabric_name] = self._count_by_severity(faults)
        
        recommendations = self._generate_recommendations(all_fabric_faults)
        
        return ComparisonResult(
            fabric_names=list(all_fabric_faults.keys()),
            common_faults=common_faults,
            unique_faults=unique_faults,
            severity_comparison=severity_comparison,
            recommendations=recommendations
        )
    
    def _extract_faults_from_fabric(self, fabric_data: Dict[str, Any]) -> List[FaultRecord]:
        """Extract fault records from fabric JSON data"""
        faults = []
        
        for file_data in fabric_data.get("files", []):
            json_data = file_data.get("data", {})
            
            if "imdata" in json_data:
                faults.extend(self._parse_aci_imdata_faults(json_data["imdata"]))
            elif "faultInst" in json_data:
                faults.extend(self._parse_fault_instances(json_data["faultInst"]))
            elif isinstance(json_data, list):
                for item in json_data:
                    if "faultInst" in item:
                        faults.extend(self._parse_fault_instances([item["faultInst"]]))
        
        return faults
    
    def _parse_aci_imdata_faults(self, imdata: List[Dict]) -> List[FaultRecord]:
        """Parse faults from ACI imdata structure"""
        faults = []
        
        for item in imdata:
            if "faultInst" in item:
                fault_data = item["faultInst"]["attributes"]
                fault = self._create_fault_record(fault_data)
                if fault:
                    faults.append(fault)
        
        return faults
    
    def _parse_fault_instances(self, fault_instances: List[Dict]) -> List[FaultRecord]:
        """Parse fault instances directly"""
        faults = []
        
        for fault_data in fault_instances:
            if isinstance(fault_data, dict) and "attributes" in fault_data:
                fault = self._create_fault_record(fault_data["attributes"])
            else:
                fault = self._create_fault_record(fault_data)
            
            if fault:
                faults.append(fault)
        
        return faults
    
    def _create_fault_record(self, fault_data: Dict[str, Any]) -> FaultRecord:
        """Create a FaultRecord from raw fault data"""
        try:
            return FaultRecord(
                fault_id=fault_data.get("dn", fault_data.get("id", "unknown")),
                severity=fault_data.get("severity", "unknown").lower(),
                type=fault_data.get("type", fault_data.get("code", "unknown")),
                description=fault_data.get("descr", fault_data.get("description", "")),
                affected_object=fault_data.get("affected", fault_data.get("dn", "")),
                timestamp=self._parse_timestamp(fault_data.get("created", fault_data.get("timestamp"))),
                status=self._determine_fault_status(fault_data)
            )
        except Exception as e:
            print(f"Error creating fault record: {e}")
            return None
    
    def _parse_timestamp(self, timestamp_str: str) -> datetime:
        """Parse ACI timestamp format"""
        if not timestamp_str:
            return datetime.now()
        
        try:
            if "T" in timestamp_str:
                return datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
            else:
                return datetime.fromisoformat(timestamp_str)
        except:
            return datetime.now()
    
    def _determine_fault_status(self, fault_data: Dict[str, Any]) -> str:
        """Determine fault status from fault data"""
        if "lc" in fault_data:
            lifecycle = fault_data["lc"]
            if lifecycle in ["raised", "created"]:
                return "active"
            elif lifecycle in ["cleared", "deleted"]:
                return "cleared"
        
        if fault_data.get("ack", "").lower() == "yes":
            return "acknowledged"
        
        return "active"
    
    def _count_by_severity(self, faults: List[FaultRecord]) -> Dict[str, int]:
        """Count faults by severity level"""
        return dict(Counter(fault.severity for fault in faults))
    
    def _count_by_status(self, faults: List[FaultRecord]) -> Dict[str, int]:
        """Count faults by status"""
        return dict(Counter(fault.status for fault in faults))
    
    def _count_by_category(self, faults: List[FaultRecord]) -> Dict[str, int]:
        """Count faults by type/category"""
        return dict(Counter(fault.type for fault in faults))
    
    def _get_top_affected_objects(self, faults: List[FaultRecord], limit: int = 10) -> List[Dict[str, Any]]:
        """Get top affected objects by fault count"""
        object_counts = Counter(fault.affected_object for fault in faults)
        
        return [
            {"object": obj, "fault_count": count}
            for obj, count in object_counts.most_common(limit)
        ]
    
    def _generate_fault_timeline(self, faults: List[FaultRecord]) -> List[Dict[str, Any]]:
        """Generate fault timeline data"""
        if not faults:
            return []
        
        timeline = defaultdict(lambda: {"date": "", "count": 0, "severities": defaultdict(int)})
        
        for fault in faults:
            date_key = fault.timestamp.strftime("%Y-%m-%d")
            timeline[date_key]["date"] = date_key
            timeline[date_key]["count"] += 1
            timeline[date_key]["severities"][fault.severity] += 1
        
        timeline_list = list(timeline.values())
        timeline_list.sort(key=lambda x: x["date"])
        
        return timeline_list
    
    def _find_common_faults(self, all_fabric_faults: Dict[str, List[FaultRecord]]) -> List[FaultRecord]:
        """Find faults common across all fabrics"""
        if len(all_fabric_faults) < 2:
            return []
        
        fabric_names = list(all_fabric_faults.keys())
        common_fault_types = set(fault.type for fault in all_fabric_faults[fabric_names[0]])
        
        for fabric_name in fabric_names[1:]:
            fabric_fault_types = set(fault.type for fault in all_fabric_faults[fabric_name])
            common_fault_types &= fabric_fault_types
        
        common_faults = []
        for fault_type in common_fault_types:
            for fault in all_fabric_faults[fabric_names[0]]:
                if fault.type == fault_type:
                    common_faults.append(fault)
                    break
        
        return common_faults
    
    def _find_unique_faults(self, all_fabric_faults: Dict[str, List[FaultRecord]]) -> Dict[str, List[FaultRecord]]:
        """Find faults unique to each fabric"""
        unique_faults = {}
        
        for fabric_name, faults in all_fabric_faults.items():
            fabric_fault_types = set(fault.type for fault in faults)
            
            other_fault_types = set()
            for other_fabric, other_faults in all_fabric_faults.items():
                if other_fabric != fabric_name:
                    other_fault_types.update(fault.type for fault in other_faults)
            
            unique_fault_types = fabric_fault_types - other_fault_types
            
            unique_faults[fabric_name] = [
                fault for fault in faults if fault.type in unique_fault_types
            ]
        
        return unique_faults
    
    def _generate_recommendations(self, all_fabric_faults: Dict[str, List[FaultRecord]]) -> List[str]:
        """Generate recommendations based on fault analysis"""
        recommendations = []
        
        total_critical = sum(
            len([f for f in faults if f.severity == "critical"])
            for faults in all_fabric_faults.values()
        )
        
        if total_critical > 0:
            recommendations.append(
                f"Found {total_critical} critical faults across fabrics. "
                "Immediate attention required for critical issues."
            )
        
        common_fault_types = set()
        for faults in all_fabric_faults.values():
            fault_types = set(fault.type for fault in faults)
            if not common_fault_types:
                common_fault_types = fault_types
            else:
                common_fault_types &= fault_types
        
        if common_fault_types:
            recommendations.append(
                f"Common fault types found across all fabrics: {', '.join(list(common_fault_types)[:3])}. "
                "Consider implementing fabric-wide policies to address these recurring issues."
            )
        
        for fabric_name, faults in all_fabric_faults.items():
            if len(faults) > 100:
                recommendations.append(
                    f"Fabric '{fabric_name}' has {len(faults)} faults. "
                    "Consider detailed investigation of this fabric's configuration."
                )
        
        if not recommendations:
            recommendations.append("No critical issues detected. Continue monitoring fabric health.")
        
        return recommendations
