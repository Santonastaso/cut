import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsList, TabsTrigger, TabsContent, Checkbox, Input } from '../components/ui';
import { AllocationView, RollView } from '../components/visualization';
import { useOptimizationStore, useStockStore, useRequestsStore } from '../store';
import { getAlgorithm, ALGORITHMS } from '../algorithms';

export default function OptimizationPage() {
  const { 
    optimizationResult, 
    currentAlgorithm, 
    isLoading,
    setOptimizationResult,
    setCurrentAlgorithm,
    setLoading
  } = useOptimizationStore();
  
  const { stockRolls } = useStockStore();
  const { cutRequests } = useRequestsStore();
  const [activeTab, setActiveTab] = useState('allocation');
  
  // Request selection state
  const [selectedRequests, setSelectedRequests] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [materialFilter, setMaterialFilter] = useState('all');

  // Initialize selected requests when cutRequests change
  useEffect(() => {
    if (cutRequests.length > 0 && selectedRequests.size === 0) {
      const allRequestIds = new Set(cutRequests.map(req => req.id));
      setSelectedRequests(allRequestIds);
    }
  }, [cutRequests]);

  // Filter requests based on search and filters
  const filteredRequests = cutRequests.filter(request => {
    const matchesSearch = !searchTerm || 
      request.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.material?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    const matchesMaterial = materialFilter === 'all' || request.material === materialFilter;
    
    return matchesSearch && matchesPriority && matchesMaterial;
  });

  // Get unique materials for filter
  const uniqueMaterials = [...new Set(cutRequests.map(req => req.material))].filter(Boolean);

  const handleRequestToggle = (requestId) => {
    setSelectedRequests(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(requestId)) {
        newSelected.delete(requestId);
      } else {
        newSelected.add(requestId);
      }
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    const allRequestIds = new Set(filteredRequests.map(req => req.id));
    setSelectedRequests(allRequestIds);
  };

  const handleSelectNone = () => {
    setSelectedRequests(new Set());
  };

  const handleAlgorithmChange = (algorithm) => {
    setCurrentAlgorithm(algorithm);
  };

  const handleOptimize = async () => {
    if (selectedRequests.size === 0) {
      toast.error('Seleziona almeno una richiesta');
      return;
    }

    if (stockRolls.length === 0) {
      toast.error('Nessuna bobina disponibile in magazzino');
      return;
    }

    try {
      setLoading(true, 'Ottimizzazione in corso...');
      
      const selectedRequestObjects = cutRequests.filter(req => selectedRequests.has(req.id));
      
      // Debug logging
      console.log('=== Optimization Debug ===');
      console.log('Current algorithm:', currentAlgorithm);
      console.log('Selected requests:', selectedRequestObjects.length);
      console.log('Stock rolls:', stockRolls.length);
      console.log('Request priorities:', selectedRequestObjects.map(req => req.priority));
      
      const algorithm = getAlgorithm(currentAlgorithm);
      console.log('Algorithm instance:', algorithm.constructor.name);
      
      const result = await algorithm.optimize(stockRolls, selectedRequestObjects);
      
      console.log('Result:', result);
      
      await setOptimizationResult({
        ...result,
        algorithmType: currentAlgorithm,
        settings: {}
      });
      
      toast.success('Ottimizzazione completata');
    } catch (error) {
      console.error('Optimization error:', error);
      toast.error('Errore durante l\'ottimizzazione');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadgeClass = (priority) => {
    const classes = {
      'high': 'bg-red-100 text-red-800',
      'normal': 'bg-blue-100 text-blue-800', 
      'low': 'bg-yellow-100 text-yellow-800'
    };
    return classes[priority] || 'bg-gray-100 text-gray-800';
  };

  const formatPriority = (priority) => {
    const labels = {
      'high': 'Alta',
      'normal': 'Normale', 
      'low': 'Bassa'
    };
    return labels[priority] || 'Sconosciuta';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Request Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selezione Richieste</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <Input
              placeholder="Cerca ODP o materiale..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le priorità</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="normal">Normale</SelectItem>
                <SelectItem value="low">Bassa</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={materialFilter} onValueChange={setMaterialFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i materiali</SelectItem>
                {uniqueMaterials.map(material => (
                  <SelectItem key={material} value={material}>{material}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selection Controls */}
          <div className="flex justify-between items-center">
            <div className="text-sm">
              {selectedRequests.size} di {filteredRequests.length} selezionate
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Seleziona Tutte
              </Button>
              <Button variant="outline" size="sm" onClick={handleSelectNone}>
                Deseleziona Tutte
              </Button>
            </div>
          </div>

          {/* Request List */}
          <div className="border rounded-lg max-h-64 overflow-y-auto">
            {filteredRequests.map(request => (
              <div key={request.id} className="flex items-center p-3 border-b last:border-b-0">
                <Checkbox
                  checked={selectedRequests.has(request.id)}
                  onCheckedChange={() => handleRequestToggle(request.id)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium">{request.orderNumber}</div>
                  <div className="text-sm text-gray-600">
                    {request.material} - {request.width}×{request.length} - Qty: {request.quantity}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${getPriorityBadgeClass(request.priority)}`}>
                  {formatPriority(request.priority)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Algorithm Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Algoritmo di Ottimizzazione</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                Seleziona Algoritmo
              </label>
              <Select value={currentAlgorithm} onValueChange={handleAlgorithmChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ALGORITHMS).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600 mt-1">
                {ALGORITHMS[currentAlgorithm]?.description}
              </p>
            </div>
            <Button 
              onClick={handleOptimize} 
              disabled={isLoading || selectedRequests.size === 0}
              className="h-10"
            >
              {isLoading ? 'Ottimizzazione...' : 'Ottimizza'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {optimizationResult && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Risultati Ottimizzazione</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold">
                    {optimizationResult.statistics.efficiency}%
                  </div>
                  <div className="text-sm">Efficienza</div>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold">
                    {optimizationResult.statistics.totalWaste}m²
                  </div>
                  <div className="text-sm">Sfrido Totale</div>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold">
                    {optimizationResult.statistics.rollsUsed}/{optimizationResult.statistics.totalRolls}
                  </div>
                  <div className="text-sm">Bobine Utilizzate</div>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold">
                    {optimizationResult.statistics.fulfilledRequests}/{optimizationResult.statistics.totalRequests}
                  </div>
                  <div className="text-sm">Richieste Soddisfatte</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle>Analisi Dettagliata</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="allocation">Allocazione per Richiesta</TabsTrigger>
                  <TabsTrigger value="rolls">Vista Bobine</TabsTrigger>
                </TabsList>
                
                <TabsContent value="allocation" className="mt-4">
                  <AllocationView result={optimizationResult} />
                </TabsContent>
                
                <TabsContent value="rolls" className="mt-4">
                  <RollView result={optimizationResult} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}