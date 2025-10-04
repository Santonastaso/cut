import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsList, TabsTrigger, TabsContent, Checkbox, Input } from '../components/ui';
import { AllocationView, RollView } from '../components/visualization';
import DataTable from '../components/DataTable';
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
  const [activeTab, setActiveTab] = useState('table');
  
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
    <div className="p-6 space-y-8">
      {/* Request Selection */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Selezione Richieste</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Cerca ODP o materiale..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            
            <div className="flex gap-3">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-44">
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
                <SelectTrigger className="w-44">
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
          </div>

          {/* Selection Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-sm font-medium text-gray-700">
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
          <div className="border rounded-lg max-h-80 overflow-y-auto">
            {filteredRequests.map(request => (
              <div key={request.id} className="flex items-center p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                <Checkbox
                  checked={selectedRequests.has(request.id)}
                  onCheckedChange={() => handleRequestToggle(request.id)}
                  className="mr-4"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 mb-1">{request.orderNumber}</div>
                  <div className="text-sm text-gray-600">
                    {request.material} - {request.width}×{request.length} - Qty: {request.quantity}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityBadgeClass(request.priority)}`}>
                  {formatPriority(request.priority)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Algorithm Selection */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Algoritmo di Ottimizzazione</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-end">
            <div className="flex-1 space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Seleziona Algoritmo
              </label>
              <Select value={currentAlgorithm} onValueChange={handleAlgorithmChange}>
                <SelectTrigger className="w-full">
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
              <p className="text-sm text-gray-600 leading-relaxed">
                {ALGORITHMS[currentAlgorithm]?.description}
              </p>
            </div>
            <Button 
              onClick={handleOptimize} 
              disabled={isLoading || selectedRequests.size === 0}
              size="lg"
              className="w-full lg:w-auto"
            >
              {isLoading ? 'Ottimizzazione...' : 'Ottimizza'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {optimizationResult && (
        <div className="space-y-6">
          {/* Simple Cutting Results Table */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Piano di Taglio</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={(() => {
                  const tableData = [];
                  optimizationResult.cuttingPlans.forEach((materialPlan) => {
                    materialPlan.patterns.forEach((pattern, index) => {
                      const allPieces = [];
                      
                      // Add cut pieces as "Product"
                      pattern.cuts.forEach((cut, cutIndex) => {
                        allPieces.push({
                          id: `${materialPlan.material}-${index}-${cutIndex}`,
                          bobina: pattern.roll.code,
                          materiale: materialPlan.material,
                          tipo: 'Product',
                          pezzo: `${cut.request.orderNumber} - ${cut.width}mm × ${cut.length}m`
                        });
                      });
                      
                      // Add remaining pieces as "Back to Storage"
                      pattern.remainingPieces.forEach((piece, pieceIndex) => {
                        allPieces.push({
                          id: `${materialPlan.material}-${index}-remaining-${pieceIndex}`,
                          bobina: pattern.roll.code,
                          materiale: materialPlan.material,
                          tipo: 'Back to Storage',
                          pezzo: `${piece.width}mm × ${piece.length}m`
                        });
                      });
                      
                      tableData.push(...allPieces);
                    });
                  });
                  return tableData;
                })()}
                columns={[
                  {
                    accessorKey: 'bobina',
                    header: 'Bobina',
                  },
                  {
                    accessorKey: 'materiale',
                    header: 'Materiale',
                  },
                  {
                    accessorKey: 'tipo',
                    header: 'Tipo',
                    cell: ({ getValue }) => {
                      const tipo = getValue();
                      return (
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          tipo === 'Product' 
                            ? 'bg-gray-100 text-gray-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {tipo}
                        </span>
                      );
                    }
                  },
                  {
                    accessorKey: 'pezzo',
                    header: 'Pezzo',
                  }
                ]}
                enableFiltering={false}
                enableGlobalSearch={false}
                enableColumnVisibility={false}
                initialPageSize={25}
              />
            </CardContent>
          </Card>

          {/* 2D Cuts Visualization */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Visualizzazione Tagli</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {optimizationResult.cuttingPlans.map((materialPlan, materialIndex) => (
                  <div key={materialIndex} className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Materiale: {materialPlan.material}
                    </h3>
                    <div className="space-y-4">
                      {materialPlan.patterns.map((pattern, patternIndex) => (
                        <div key={patternIndex} className="border rounded-lg p-4 bg-gray-50">
                          <div className="mb-3">
                            <h4 className="font-medium text-gray-700">
                              Bobina: {pattern.roll.code} ({pattern.roll.width}mm × {pattern.roll.length}m)
                            </h4>
                            <div className="text-sm text-gray-600 mt-1">
                              Tagli: {pattern.cuts.length} | 
                              Larghezza totale utilizzata: {pattern.cuts.reduce((sum, cut) => sum + cut.width, 0)}mm / {pattern.roll.width}mm | 
                              Efficienza: {pattern.efficiency.toFixed(1)}%
                            </div>
                          </div>
                          <div className="relative bg-white border rounded p-4" style={{ minHeight: '200px' }}>
                            {/* Roll outline */}
                            <div 
                              className="absolute border-2 border-gray-400 bg-gray-100"
                              style={{
                                width: '100%',
                                height: '200px',
                                maxWidth: '600px'
                              }}
                            >
                              {/* Cuts visualization */}
                              {(() => {
                                const scale = 600 / pattern.roll.width; // Scale width to fit in 600px
                                let currentX = 0; // Track current X position for proper layout
                                
                                return pattern.cuts.map((cut, cutIndex) => {
                                  const width = cut.width * scale;
                                  const height = (cut.length / pattern.roll.length) * 200; // Scale height proportionally
                                  
                                  // Use calculated position or fallback to sequential positioning
                                  const leftPosition = cut.position?.x !== undefined ? 
                                    cut.position.x * scale : 
                                    currentX;
                                  
                                  // Update currentX for next cut (sequential positioning)
                                  currentX += width;
                                  
                                  // Validate that cut fits within roll width
                                  const totalWidth = currentX;
                                  const isValidLayout = totalWidth <= 600; // 600px is our scaled roll width
                                  
                                  return (
                                    <div
                                      key={cutIndex}
                                      className={`absolute border-2 flex items-center justify-center text-xs font-medium ${
                                        isValidLayout ? 'border-blue-500 bg-blue-200' : 'border-red-500 bg-red-200'
                                      }`}
                                      style={{
                                        left: `${leftPosition}px`,
                                        top: `${(cut.position?.y || 0) * (200 / pattern.roll.length)}px`,
                                        width: `${width}px`,
                                        height: `${height}px`,
                                        minWidth: '20px',
                                        minHeight: '20px'
                                      }}
                                      title={`${cut.request.orderNumber}: ${cut.width}mm × ${cut.length}m${!isValidLayout ? ' (WIDTH OVERFLOW!)' : ''}`}
                                    >
                                      <div className="text-center">
                                        <div className="font-bold">{cut.request.orderNumber}</div>
                                        <div className="text-xs opacity-75">{cut.width}mm</div>
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}