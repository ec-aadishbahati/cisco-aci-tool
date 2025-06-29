import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, X, CheckCircle } from 'lucide-react'
import { fabricApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { formatBytes } from '@/lib/utils'

interface FabricUploaderProps {
  onUploadSuccess: () => void
}

interface FileWithPreview extends File {
  preview?: string
}

const FabricUploader: React.FC<FabricUploaderProps> = ({ onUploadSuccess }) => {
  const [fabricName, setFabricName] = useState('')
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: ({ name, files }: { name: string; files: File[] }) =>
      fabricApi.uploadFabric(name, files),
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `Fabric "${data.fabric_name}" uploaded with ${data.files_processed} files`,
      })
      setFiles([])
      setFabricName('')
      setUploadProgress(0)
      queryClient.invalidateQueries({ queryKey: ['fabrics'] })
      onUploadSuccess()
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.response?.data?.detail || "Failed to upload fabric data",
        variant: "destructive",
      })
      setUploadProgress(0)
    },
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const jsonFiles = acceptedFiles.filter(file => 
      file.type === 'application/json' || file.name.endsWith('.json')
    )
    
    if (jsonFiles.length !== acceptedFiles.length) {
      toast({
        title: "Invalid Files",
        description: "Only JSON files are accepted",
        variant: "destructive",
      })
    }

    setFiles(prev => [...prev, ...jsonFiles])
  }, [toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json']
    },
    multiple: true
  })

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = () => {
    if (!fabricName.trim()) {
      toast({
        title: "Missing Fabric Name",
        description: "Please enter a name for the fabric",
        variant: "destructive",
      })
      return
    }

    if (files.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one JSON file to upload",
        variant: "destructive",
      })
      return
    }

    uploadMutation.mutate({ name: fabricName.trim(), files })
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Fabric Configuration
          </CardTitle>
          <CardDescription>
            Upload ACI fabric JSON files for fault analysis and configuration review
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fabric-name">Fabric Name</Label>
            <Input
              id="fabric-name"
              placeholder="Enter fabric name (e.g., Production-DC1)"
              value={fabricName}
              onChange={(e) => setFabricName(e.target.value)}
              disabled={uploadMutation.isPending}
            />
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg">Drop the JSON files here...</p>
            ) : (
              <div>
                <p className="text-lg mb-2">Drag & drop JSON files here</p>
                <p className="text-sm text-muted-foreground">
                  or click to select files
                </p>
              </div>
            )}
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Files ({files.length})</Label>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatBytes(file.size)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={uploadMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Total size: {formatBytes(totalSize)}
              </p>
            </div>
          )}

          {uploadMutation.isPending && (
            <div className="space-y-2">
              <Label>Upload Progress</Label>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Uploading fabric data...
              </p>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={uploadMutation.isPending || !fabricName.trim() || files.length === 0}
            className="w-full"
          >
            {uploadMutation.isPending ? (
              "Uploading..."
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Fabric
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default FabricUploader
