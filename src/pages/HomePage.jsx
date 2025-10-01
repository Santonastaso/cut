import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui';
import { Button } from '../components/ui';
import { useMaterialsStore, useStockStore, useRequestsStore } from '../store';

export default function HomePage() {
  const navigate = useNavigate();
  const { materials } = useMaterialsStore();
  const { stockRolls } = useStockStore();
  const { cutRequests } = useRequestsStore();

  // Calculate metrics
  const totalMaterials = materials.length;
  const totalStockRolls = stockRolls.length;
  const totalRequests = cutRequests.length;
  const totalAlgorithms = 6;

  // Calculate total stock weight
  const totalStockWeight = stockRolls.reduce((sum, roll) => {
    return sum + (roll.weight || 0);
  }, 0);

  // Calculate total request length
  const totalRequestLength = cutRequests.reduce((sum, request) => {
    return sum + (request.length * request.quantity);
  }, 0);

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard OptiCUT Pro</h1>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="text-sm font-medium text-gray-800 mb-1">Materiali</h3>
          <div className="text-2xl font-bold text-gray-900">{totalMaterials}</div>
          <div className="text-xs text-gray-600">Catalogo materiali</div>
        </Card>
        
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="text-sm font-medium text-gray-800 mb-1">Bobine in Magazzino</h3>
          <div className="text-2xl font-bold text-gray-900">{totalStockRolls}</div>
          <div className="text-xs text-gray-600">Peso totale: {totalStockWeight.toLocaleString()} kg</div>
        </Card>
        
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="text-sm font-medium text-gray-800 mb-1">Richieste Attive</h3>
          <div className="text-2xl font-bold text-gray-900">{totalRequests}</div>
          <div className="text-xs text-gray-600">Lunghezza totale: {totalRequestLength.toLocaleString()} m</div>
        </Card>
        
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="text-sm font-medium text-gray-800 mb-1">Algoritmi Disponibili</h3>
          <div className="text-2xl font-bold text-gray-900">{totalAlgorithms}</div>
          <div className="text-xs text-gray-600">Ottimizzazione avanzata</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Azioni Rapide</h2>
        <div className="flex flex-wrap gap-3">
          <Button 
            className="bg-navy-800 hover:bg-navy-700"
            onClick={() => navigate('/materials/list')}
          >
            Gestisci Materiali
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/stock/list')}
          >
            Visualizza Magazzino
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/requests/list')}
          >
            Gestisci Richieste
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/optimization')}
          >
            Calcola Ottimizzazione
          </Button>
        </div>
      </Card>
    </div>
  );
}

