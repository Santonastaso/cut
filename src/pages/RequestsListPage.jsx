import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui';
import DataTable from '../components/DataTable';
import { useRequestsStore } from '../store';
import { formatPriority, getPriorityBadgeClass } from '../utils/validation';
import { Plus } from 'lucide-react';

export default function RequestsListPage() {
  const navigate = useNavigate();
  const { cutRequests, deleteCutRequest } = useRequestsStore();

  const handleEdit = (request) => {
    navigate(`/requests/edit/${request.id}`);
  };

  const handleDelete = async (id) => {
    if (confirm('Sei sicuro di voler eliminare questa richiesta?')) {
      try {
        await deleteCutRequest(id);
        toast.success('Richiesta eliminata');
      } catch (error) {
        toast.error('Errore durante l\'eliminazione: ' + error.message);
      }
    }
  };

  const handleNew = () => {
    navigate('/requests/new');
  };

  const columns = [
    {
      accessorKey: 'orderNumber',
      header: 'ODP',
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
      id: 'totalLength',
      header: 'Lunghezza Totale (m)',
      cell: ({ row }) => row.original.length * row.original.quantity
    },
    {
      accessorKey: 'priority',
      header: 'Priorità',
      cell: ({ getValue }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeClass(getValue())}`}>
          {formatPriority(getValue())}
        </span>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Richieste di Taglio</h1>
          <p className="text-gray-600">Gestisci gli ordini di taglio con priorità</p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4 mr-2" />
          Aggiungi Richiesta
        </Button>
      </div>

      {/* Requests Table */}
      <div className="rounded-md border overflow-hidden">
        <DataTable
          data={cutRequests}
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

