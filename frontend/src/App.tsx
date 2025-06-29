import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toaster } from '@/components/ui/toaster'
import FabricUploader from '@/components/FabricUploader'
import FaultAnalysis from '@/components/FaultAnalysis'
import FabricComparison from '@/components/FabricComparison'
import FabricList from '@/components/FabricList'
import { Activity, Upload, GitCompare, List } from 'lucide-react'

const queryClient = new QueryClient()

function App() {
  const [selectedFabricId, setSelectedFabricId] = useState<string | null>(null)

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background">
          <header className="border-b">
            <div className="container mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold text-foreground">
                Cisco ACI Tool
              </h1>
              <p className="text-muted-foreground">
                Modular, offline-capable tool for analyzing ACI fabric faults and configurations
              </p>
            </div>
          </header>

          <main className="container mx-auto px-4 py-6">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="fabrics" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Fabrics
                </TabsTrigger>
                <TabsTrigger value="analysis" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Fault Analysis
                </TabsTrigger>
                <TabsTrigger value="comparison" className="flex items-center gap-2">
                  <GitCompare className="h-4 w-4" />
                  Comparison
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-6">
                <FabricUploader onUploadSuccess={() => {
                }} />
              </TabsContent>

              <TabsContent value="fabrics" className="mt-6">
                <FabricList 
                  onFabricSelect={setSelectedFabricId}
                  selectedFabricId={selectedFabricId}
                />
              </TabsContent>

              <TabsContent value="analysis" className="mt-6">
                <FaultAnalysis fabricId={selectedFabricId} />
              </TabsContent>

              <TabsContent value="comparison" className="mt-6">
                <FabricComparison />
              </TabsContent>
            </Tabs>
          </main>

          <Toaster />
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App
