import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui';
import DataTable from '../components/DataTable';
import { useStockStore } from '../store';
import { Plus } from 'lucide-react';

export default function StockListPage() {
  const navigate = useNavigate();
  const { stockRolls, deleteStockRoll } = useStockStore();

  const handleEdit = (roll) => {
    navigate(`/stock/edit/${roll.id}`);
  };

  const handleDelete = async (id) => {
    if (confirm('Sei sicuro di voler eliminare questa bobina?')) {
      try {
        await deleteStockRoll(id);
        toast.success('Bobina eliminata');
      } catch (error) {
        toast.error('Errore durante l\'eliminazione: ' + error.message);
      }
    }
  };

  const handleNew = () => {
    navigate('/stock/new');
  };

  const columns = [
    {
      accessorKey: 'code',
      header: 'Codice',
    },
    {
      accessorKey: 'material',
      header: 'Materiale',
    },
    {
      accessorKey: 'width',
      header: 'Larghezza (mm)',
    },
    {
      accessorKey: 'length',
      header: 'Lunghezza (m)',
    },
    {
      accessorKey: 'weight',
      header: 'Peso (kg)',
    },
    {
      accessorKey: 'batch',
      header: 'Lotto',
    },
    {
      id: 'alpha',
      header: 'Coeff. α',
      cell: ({ row }) => ((row.original.specificWeight * row.original.width) / 1000000).toFixed(6)
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bobine in Magazzino</h1>
          <p className="text-gray-600">Gestisci le bobine disponibili per il taglio</p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4 mr-2" />
          Aggiungi Bobina
        </Button>
      </div>

      {/* Stock Table */}
      <div className="rounded-md border overflow-hidden">
        <DataTable
          data={stockRolls}
          columns={columns}
          onEditRow={handleEdit}
          onDeleteRow={handleDelete}
          enableGlobalSearch={true}
          enableColumnVisibility={true}
          initialPageSize={10}
        />
      </div>
    </div>
  );
}
