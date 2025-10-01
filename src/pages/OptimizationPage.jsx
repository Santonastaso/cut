import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsList, TabsTrigger, TabsContent, Progress, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, Checkbox, Input } from '../components/ui';
import { AllocationView, RollView, AlgorithmComparison } from '../components/visualization';
import { useOptimizationStore, useStockStore, useRequestsStore } from '../store';
import { getAlgorithm, ALGORITHMS } from '../algorithms';
import { Zap, Info, BarChart3, Layers, CheckSquare, Square, Search, Filter } from 'lucide-react';

export default function OptimizationPage() {
  const { 
    optimizationResult, 
    algorithmResults, 
    currentAlgorithm, 
    algorithmSettings,
    isLoading,
    setOptimizationResult,
    setAlgorithmResult,
    setCurrentAlgorithm,
    updateAlgorithmSettings,
    setLoading,
    getAlgorithmComparison
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
      // Auto-select all requests initially
      const allRequestIds = new Set(cutRequests.map(req => req.id));
      setSelectedRequests(allRequestIds);
    }
  }, [cutRequests, selectedRequests.size]);

  // Filter requests based on search and filters
  const filteredRequests = cutRequests.filter(request => {
    const matchesSearch = request.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.material.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    const matchesMaterial = materialFilter === 'all' || request.material === materialFilter;
    
    return matchesSearch && matchesPriority && matchesMaterial;
  });

  // Get unique materials for filter
  const uniqueMaterials = [...new Set(cutRequests.map(req => req.material))];

  const handleOptimize = async () => {
    if (!stockRolls.length || selectedRequests.size === 0) {
      toast.error('Seleziona almeno una bobina e una richiesta');
      return;
    }

    try {
      setLoading(true, `Inizializzazione dell'algoritmo: ${currentAlgorithm}`);
      
      // Get algorithm instance
      const algorithm = getAlgorithm(currentAlgorithm);
      
      // Get settings for current algorithm
      const settings = algorithmSettings[currentAlgorithm] || {};
      
      // Filter cut requests to only selected ones
      const selectedCutRequests = cutRequests.filter(req => selectedRequests.has(req.id));
      
      // Simulate optimization with delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Run optimization
      const result = algorithm.optimize(stockRolls, selectedCutRequests, settings);
      
      // Store result
      await setOptimizationResult(result);
      setAlgorithmResult(currentAlgorithm, result);
      
      // Show comparison if we have multiple results
      const comparison = getAlgorithmComparison();
      if (comparison) {
        toast.success('Ottimizzazione completata! Confronto algoritmi disponibile.');
      } else {
        toast.success('Ottimizzazione completata!');
      }
      
    } catch (error) {
      console.error('Errore nell\'ottimizzazione:', error);
      toast.error('Si è verificato un errore durante l\'ottimizzazione: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAlgorithmChange = (algorithmType) => {
    setCurrentAlgorithm(algorithmType);
  };

  const handleSettingsChange = (algorithmType, settings) => {
    updateAlgorithmSettings(algorithmType, settings);
  };

  // Request selection handlers
  const handleSelectRequest = (requestId) => {
    const newSelected = new Set(selectedRequests);
    if (newSelected.has(requestId)) {
      newSelected.delete(requestId);
    } else {
      newSelected.add(requestId);
    }
    setSelectedRequests(newSelected);
  };

  const handleSelectAll = () => {
    const allRequestIds = new Set(filteredRequests.map(req => req.id));
    setSelectedRequests(allRequestIds);
  };

  const handleSelectNone = () => {
    setSelectedRequests(new Set());
  };

  const handleSelectByPriority = (priority) => {
    const priorityRequestIds = new Set(
      filteredRequests
        .filter(req => req.priority === priority)
        .map(req => req.id)
    );
    setSelectedRequests(priorityRequestIds);
  };

  const getPriorityBadgeClass = (priority) => {
    const classes = {
      '4': 'bg-red-100 text-red-800',
      '3': 'bg-orange-100 text-orange-800',
      '2': 'bg-yellow-100 text-yellow-800',
      '1': 'bg-green-100 text-green-800'
    };
    return classes[priority] || 'bg-gray-100 text-gray-800';
  };

  const formatPriority = (priority) => {
    const labels = {
      '4': 'Urgente',
      '3': 'Alta',
      '2': 'Media',
      '1': 'Bassa'
    };
    return labels[priority] || 'Sconosciuta';
  };

  const comparison = getAlgorithmComparison();

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        {/* Request Selection - Streamlined */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Filter className="w-5 h-5 text-blue-600" />
                <span>Selezione Richieste</span>
              </CardTitle>
              <div className="text-sm font-medium text-blue-900">
                {selectedRequests.size} di {filteredRequests.length} selezionate
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Compact Search and Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cerca ODP o materiale..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le priorità</SelectItem>
                  <SelectItem value="4">Urgente</SelectItem>
                  <SelectItem value="3">Alta</SelectItem>
                  <SelectItem value="2">Media</SelectItem>
                  <SelectItem value="1">Bassa</SelectItem>
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

            {/* Quick Actions */}
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">Azioni rapide:</span>
                <div className="flex space-x-1">
                  <Button variant="outline" size="sm" onClick={handleSelectAll} className="text-xs h-7">
                    <CheckSquare className="w-3 h-3 mr-1" />
                    Tutti
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSelectNone} className="text-xs h-7">
                    <Square className="w-3 h-3 mr-1" />
                    Nessuno
                  </Button>
                </div>
                <div className="flex space-x-1">
                  {['4', '3', '2', '1'].map(priority => (
                    <Button
                      key={priority}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectByPriority(priority)}
                      className="text-xs px-2 py-1 h-7"
                    >
                      {formatPriority(priority)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Compact Request List */}
            <div className="max-h-40 overflow-y-auto border rounded-lg bg-white">
              {filteredRequests.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Filter className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Nessuna richiesta trovata</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredRequests.map(request => (
                    <div
                      key={request.id}
                      className={`p-2 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                        selectedRequests.has(request.id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <Checkbox
                        checked={selectedRequests.has(request.id)}
                        onChange={() => handleSelectRequest(request.id)}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm text-gray-900">{request.orderNumber}</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeClass(request.priority)}`}>
                            {formatPriority(request.priority)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {request.material} • {request.width}mm × {request.length}m • Qty: {request.quantity}
                        </div>
                      </div>
                      
                      <div className="text-right text-xs text-gray-500">
                        <div className="font-medium">{(request.width * request.length * request.quantity / 1000000).toFixed(2)}m²</div>
                        <div>{(request.length * request.quantity).toFixed(0)}m</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Algorithm Selection - Streamlined */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Zap className="w-5 h-5 text-blue-600" />
              <span>Configurazione Algoritmo</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Algorithm Selection */}
              <div className="lg:col-span-2 space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <span>Algoritmo di Ottimizzazione</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <div className="space-y-2 text-xs">
                          <div><strong>Combinazione Lunghezze:</strong> Ottimizzazione bidimensionale standard.</div>
                          <div><strong>Minimizzazione Sfrido:</strong> Riduce al minimo il materiale sprecato.</div>
                          <div><strong>Priorità Ordini:</strong> Privilegia gli ordini ad alta priorità.</div>
                          <div><strong>Minimizzazione Bobine:</strong> Utilizza il minor numero possibile di bobine.</div>
                          <div><strong>Multi-obiettivo:</strong> Consente di bilanciare diversi obiettivi.</div>
                          <div><strong>Generazione Colonne:</strong> Algoritmo avanzato per problemi di grandi dimensioni.</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </label>
                  <Select value={currentAlgorithm} onValueChange={handleAlgorithmChange}>
                    <SelectTrigger className="h-10">
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
                </div>

                {/* Algorithm Description */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                  <h4 className="font-semibold text-blue-900 mb-1 text-sm">
                    {ALGORITHMS[currentAlgorithm]?.name}
                  </h4>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    {ALGORITHMS[currentAlgorithm]?.description}
                  </p>
                </div>
              </div>
              
              {/* Optimize Button */}
              <div className="flex flex-col justify-center">
                <Button 
                  onClick={handleOptimize}
                  disabled={isLoading || selectedRequests.size === 0}
                  className="w-full h-11 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Calcolo in corso...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Calcola Ottimizzazione
                    </>
                  )}
                </Button>
                {selectedRequests.size === 0 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Seleziona almeno una richiesta
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {optimizationResult && (
          <div className="space-y-6">
            {/* Summary Metrics - Enhanced */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span>Risultati Ottimizzazione</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {optimizationResult.statistics.efficiency}%
                    </div>
                    <div className="text-sm font-medium text-blue-800">Efficienza</div>
                    <div className="text-xs text-blue-600 mt-1">Utilizzo materiale</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                    <div className="text-3xl font-bold text-red-600 mb-1">
                      {optimizationResult.statistics.totalWaste}m²
                    </div>
                    <div className="text-sm font-medium text-red-800">Sfrido Totale</div>
                    <div className="text-xs text-red-600 mt-1">Materiale sprecato</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {optimizationResult.statistics.rollsUsed}/{optimizationResult.statistics.totalRolls}
                    </div>
                    <div className="text-sm font-medium text-green-800">Bobine Utilizzate</div>
                    <div className="text-xs text-green-600 mt-1">Efficienza bobine</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="text-3xl font-bold text-purple-600 mb-1">
                      {optimizationResult.statistics.fulfilledRequests}/{optimizationResult.statistics.totalRequests}
                    </div>
                    <div className="text-sm font-medium text-purple-800">Richieste Soddisfatte</div>
                    <div className="text-xs text-purple-600 mt-1">Completamento ordini</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Algorithm Comparison */}
            {comparison && (
              <div className="mt-8">
                <AlgorithmComparison 
                  comparison={comparison} 
                  currentAlgorithm={currentAlgorithm}
                />
              </div>
            )}

            {/* Results Tabs - Enhanced */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Layers className="w-5 h-5 text-blue-600" />
                  <span>Analisi Dettagliata</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
                    <TabsTrigger 
                      value="allocation" 
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      Allocazione per Richiesta
                    </TabsTrigger>
                    <TabsTrigger 
                      value="rolls"
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      Vista Bobine
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="allocation" className="mt-6">
                    <AllocationView result={optimizationResult} />
                  </TabsContent>
                  
                  <TabsContent value="rolls" className="mt-6">
                    <RollView result={optimizationResult} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

