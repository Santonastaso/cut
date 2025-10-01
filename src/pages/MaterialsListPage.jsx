import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui';
import DataTable from '../components/DataTable';
import { useMaterialsStore } from '../store';
import { Plus } from 'lucide-react';

export default function MaterialsListPage() {
  const navigate = useNavigate();
  const { materials, deleteMaterial } = useMaterialsStore();

  const handleEdit = (material) => {
    navigate(`/materials/edit/${material.id}`);
  };

  const handleDelete = async (id) => {
    if (confirm('Sei sicuro di voler eliminare questo materiale?')) {
      try {
        await deleteMaterial(id);
        toast.success('Materiale eliminato');
      } catch (error) {
        toast.error('Errore durante l\'eliminazione: ' + error.message);
      }
    }
  };

  const handleNew = () => {
    navigate('/materials/new');
  };

  const columns = [
    {
      accessorKey: 'code',
      header: 'Codice',
    },
    {
      accessorKey: 'name',
      header: 'Nome',
    },
    {
      accessorKey: 'specificWeight',
      header: 'Peso Specifico (g/m²)',
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalogo Materiali</h1>
          <p className="text-gray-600">Gestisci i materiali disponibili per il taglio</p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4 mr-2" />
          Aggiungi Materiale
        </Button>
      </div>

      {/* Materials Table */}
      <div className="rounded-md border overflow-hidden">
        <DataTable
          data={materials}
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
