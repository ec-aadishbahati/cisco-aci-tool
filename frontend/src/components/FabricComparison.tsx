import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts'
import { GitCompare, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { fabricApi, type ComparisonResult } from '@/services/api'
import { useToast } from '@/hooks/use-toast'

const FabricComparison: React.FC = () => {
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([])
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null)
  const { toast } = useToast()

  const compareMutation = useMutation({
    mutationFn: (fabricIds: string[]) => fabricApi.compareFabrics(fabricIds),
    onSuccess: (data) => {
      setComparisonResult(data)
      toast({
        title: "Comparison Complete",
        description: `Compared ${data.fabric_names.length} fabrics successfully`,
      })
    },
    onError: (error: any) => {
      toast({
        title: "Comparison Failed",
        description: error.response?.data?.detail || "Failed to compare fabrics",
        variant: "destructive",
      })
    },
  })

  const handleFabricToggle = (fabricId: string) => {
    setSelectedFabrics(prev => 
      prev.includes(fabricId) 
        ? prev.filter(id => id !== fabricId)
        : [...prev, fabricId]
    )
  }

  const handleCompare = () => {
    if (selectedFabrics.length < 2) {
      toast({
        title: "Insufficient Selection",
        description: "Please select at least 2 fabrics to compare",
        variant: "destructive",
      })
      return
    }

    compareMutation.mutate(selectedFabrics)
  }

  const severityComparisonData = comparisonResult ? 
    Object.entries(comparisonResult.severity_comparison).map(([fabric, severities]) => ({
      fabric,
      ...severities
    })) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Fabric Comparison</h2>
        <Button 
          onClick={handleCompare}
          disabled={selectedFabrics.length < 2 || compareMutation.isPending}
        >
          {compareMutation.isPending ? "Comparing..." : "Compare Selected"}
        </Button>
      </div>

      {!comparisonResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Select Fabrics to Compare
            </CardTitle>
            <CardDescription>
              Choose at least 2 fabrics to analyze differences and similarities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Select fabrics from the list below and click "Compare Selected" to analyze fault patterns, 
                severity distributions, and identify common issues across your ACI environments.
              </AlertDescription>
            </Alert>
            
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">
                Selected: {selectedFabrics.length} fabric(s)
              </p>
              {/* Fabric selection would be populated from a query here */}
              <div className="text-center py-8 text-muted-foreground">
                Fabric selection interface would be implemented here
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {comparisonResult && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Comparison Summary</CardTitle>
              <CardDescription>
                Comparing {comparisonResult.fabric_names.join(', ')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {comparisonResult.common_faults.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Common Faults</p>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Object.values(comparisonResult.unique_faults).reduce((sum, faults) => sum + faults.length, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Unique Faults</p>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {comparisonResult.recommendations.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Recommendations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Severity Comparison Chart */}
          {severityComparisonData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Severity Distribution Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={severityComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fabric" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="critical" fill="#ef4444" name="Critical" />
                    <Bar dataKey="major" fill="#f97316" name="Major" />
                    <Bar dataKey="minor" fill="#eab308" name="Minor" />
                    <Bar dataKey="warning" fill="#06b6d4" name="Warning" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Common Faults */}
          {comparisonResult.common_faults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Common Faults
                </CardTitle>
                <CardDescription>
                  Faults that appear across multiple fabrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {comparisonResult.common_faults.slice(0, 10).map((fault, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{fault.description || fault.type}</span>
                      <Badge variant="secondary">{fault.severity}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unique Faults */}
          {Object.keys(comparisonResult.unique_faults).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Unique Faults by Fabric
                </CardTitle>
                <CardDescription>
                  Faults that are specific to individual fabrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(comparisonResult.unique_faults).map(([fabricName, faults]) => (
                    <div key={fabricName}>
                      <h4 className="font-medium mb-2">{fabricName}</h4>
                      <div className="space-y-1 ml-4">
                        {faults.slice(0, 5).map((fault, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span>{fault.description || fault.type}</span>
                            <Badge variant="outline" size="sm">{fault.severity}</Badge>
                          </div>
                        ))}
                        {faults.length > 5 && (
                          <p className="text-xs text-muted-foreground">
                            +{faults.length - 5} more faults
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {comparisonResult.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>
                  Suggested actions based on the comparison analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {comparisonResult.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

export default FabricComparison
