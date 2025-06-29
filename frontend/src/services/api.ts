import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface Fabric {
  id: string
  name: string
  upload_timestamp: string
  file_count: number
  total_size: number
}

export interface FaultSummary {
  fabric_id: string
  fabric_name: string
  total_faults: number
  active_faults: number
  cleared_faults: number
  critical_faults: number
  major_faults: number
  minor_faults: number
  warning_faults: number
  fault_categories: Record<string, number>
  top_affected_objects: Array<{ object: string; fault_count: number }>
  fault_timeline: Array<{ date: string; count: number; severities: Record<string, number> }>
  analysis_timestamp: string
}

export interface ComparisonResult {
  fabric_names: string[]
  common_faults: any[]
  unique_faults: Record<string, any[]>
  severity_comparison: Record<string, Record<string, number>>
  recommendations: string[]
}

export const fabricApi = {
  uploadFabric: async (fabricName: string, files: File[]) => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    
    const response = await api.post(`/api/fabrics/upload?fabric_name=${encodeURIComponent(fabricName)}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  getFabrics: async (): Promise<Fabric[]> => {
    const response = await api.get('/api/fabrics')
    return response.data
  },

  getFabric: async (fabricId: string) => {
    const response = await api.get(`/api/fabrics/${fabricId}`)
    return response.data
  },

  deleteFabric: async (fabricId: string) => {
    const response = await api.delete(`/api/fabrics/${fabricId}`)
    return response.data
  },

  analyzeFaults: async (fabricId: string): Promise<FaultSummary> => {
    const response = await api.post(`/api/analysis/faults/${fabricId}`)
    return response.data
  },

  getFaultSummary: async (fabricId: string): Promise<FaultSummary> => {
    const response = await api.get(`/api/analysis/faults/${fabricId}/summary`)
    return response.data
  },

  compareFabrics: async (fabricIds: string[]): Promise<ComparisonResult> => {
    const response = await api.post('/api/analysis/compare', fabricIds)
    return response.data
  },
}

export default api
