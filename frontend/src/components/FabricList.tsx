import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Activity, Calendar, HardDrive } from 'lucide-react'
import { fabricApi, type Fabric } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { formatBytes, formatDate } from '@/lib/utils'

interface FabricListProps {
  onFabricSelect: (fabricId: string) => void
  selectedFabricId: string | null
}

const FabricList: React.FC<FabricListProps> = ({ onFabricSelect, selectedFabricId }) => {
  const { toast } = useToast()

  const { data: fabrics, isLoading, error, refetch } = useQuery({
    queryKey: ['fabrics'],
    queryFn: fabricApi.getFabrics,
  })

  const handleDelete = async (fabricId: string, fabricName: string) => {
    if (!confirm(`Are you sure you want to delete fabric "${fabricName}"?`)) {
      return
    }

    try {
      await fabricApi.deleteFabric(fabricId)
      toast({
        title: "Fabric Deleted",
        description: `Fabric "${fabricName}" has been deleted successfully`,
      })
      refetch()
      if (selectedFabricId === fabricId) {
        onFabricSelect('')
      }
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.response?.data?.detail || "Failed to delete fabric",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Fabrics...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Fabrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load fabric list. Please try again.</p>
          <Button onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!fabrics || fabrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Fabrics Found</CardTitle>
          <CardDescription>
            Upload your first ACI fabric configuration to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Use the Upload tab to add ACI JSON files for analysis.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Fabric Configurations</h2>
        <Badge variant="secondary">{fabrics.length} fabric(s)</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {fabrics.map((fabric: Fabric) => (
          <Card
            key={fabric.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedFabricId === fabric.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onFabricSelect(fabric.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{fabric.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(fabric.id, fabric.name)
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {formatDate(fabric.upload_timestamp)}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                {fabric.file_count} file(s)
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <HardDrive className="h-4 w-4" />
                {formatBytes(fabric.total_size)}
              </div>

              {selectedFabricId === fabric.id && (
                <Badge className="w-full justify-center">Selected</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default FabricList
