import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts'
import { 
  AlertTriangle, CheckCircle, Clock, TrendingUp, 
  Activity, AlertCircle, Info 
} from 'lucide-react'
import { fabricApi, type FaultSummary } from '@/services/api'
import { useToast } from '@/hooks/use-toast'

interface FaultAnalysisProps {
  fabricId: string | null
}

const SEVERITY_COLORS = {
  critical: '#ef4444',
  major: '#f97316', 
  minor: '#eab308',
  warning: '#06b6d4'
}

const FaultAnalysis: React.FC<FaultAnalysisProps> = ({ fabricId }) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: faultSummary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['fault-summary', fabricId],
    queryFn: () => fabricApi.getFaultSummary(fabricId!),
    enabled: !!fabricId,
    retry: false
  })

  const analyzeMutation = useMutation({
    mutationFn: () => fabricApi.analyzeFaults(fabricId!),
    onSuccess: (data) => {
      toast({
        title: "Analysis Complete",
        description: `Found ${data.total_faults} faults in fabric "${data.fabric_name}"`,
      })
      queryClient.invalidateQueries({ queryKey: ['fault-summary', fabricId] })
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.response?.data?.detail || "Failed to analyze faults",
        variant: "destructive",
      })
    },
  })

  if (!fabricId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Fault Analysis
          </CardTitle>
          <CardDescription>
            Select a fabric from the Fabrics tab to analyze faults
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No fabric selected</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoadingSummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Analysis...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!faultSummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Fault Analysis
          </CardTitle>
          <CardDescription>
            No analysis found for this fabric. Run analysis to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Click "Run Analysis" to analyze faults in the selected fabric configuration.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
            className="w-full"
          >
            {analyzeMutation.isPending ? "Analyzing..." : "Run Fault Analysis"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const severityData = [
    { name: 'Critical', value: faultSummary.critical_faults, color: SEVERITY_COLORS.critical },
    { name: 'Major', value: faultSummary.major_faults, color: SEVERITY_COLORS.major },
    { name: 'Minor', value: faultSummary.minor_faults, color: SEVERITY_COLORS.minor },
    { name: 'Warning', value: faultSummary.warning_faults, color: SEVERITY_COLORS.warning },
  ]

  const categoryData = Object.entries(faultSummary.fault_categories).map(([name, value]) => ({
    name,
    value
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Fault Analysis</h2>
        <Button 
          onClick={() => analyzeMutation.mutate()}
          disabled={analyzeMutation.isPending}
          variant="outline"
        >
          {analyzeMutation.isPending ? "Re-analyzing..." : "Re-run Analysis"}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Faults</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{faultSummary.total_faults}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Faults</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{faultSummary.active_faults}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cleared Faults</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{faultSummary.cleared_faults}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Faults</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{faultSummary.critical_faults}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Faults by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Faults by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Affected Objects */}
      {faultSummary.top_affected_objects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Affected Objects</CardTitle>
            <CardDescription>
              Objects with the highest number of faults
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {faultSummary.top_affected_objects.slice(0, 10).map((obj, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{obj.object}</span>
                  <Badge variant="secondary">{obj.fault_count} faults</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fault Timeline */}
      {faultSummary.fault_timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fault Timeline</CardTitle>
            <CardDescription>
              Fault occurrence over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={faultSummary.fault_timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default FaultAnalysis
