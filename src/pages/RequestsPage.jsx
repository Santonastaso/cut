import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui';
import DataTable from '../components/DataTable';
import { useRequestsStore, useMaterialsStore } from '../store';
import { validateCutRequest, isOrderNumberDuplicate, formatPriority, getPriorityBadgeClass } from '../utils/validation';
import { Trash2, Plus } from 'lucide-react';

export default function RequestsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cutRequests, addCutRequest, updateCutRequest, deleteCutRequest } = useRequestsStore();
  const { materials, getMaterialsForSelect } = useMaterialsStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

  // Fetch data for editing if ID is provided
  useEffect(() => {
    if (id && id !== 'new') {
      setIsLoading(true);
      const request = cutRequests.find(r => r.id === parseInt(id));
      if (request) {
        setEditingItem(request);
        setIsAdding(true);
        // Pre-fill form with existing data
        reset({
          orderNumber: request.orderNumber,
          material: request.material,
          width: request.width,
          length: request.length,
          priority: request.priority,
          quantity: request.quantity
        });
      } else {
        toast.error('Richiesta non trovata');
        navigate('/requests');
      }
      setIsLoading(false);
    }
  }, [id, cutRequests, navigate, reset]);

  const onSubmit = async (data) => {
    const validation = validateCutRequest(data);
    
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    // Check for duplicate order number (exclude current item when editing)
    if (isOrderNumberDuplicate(data.orderNumber, cutRequests, editingItem?.id)) {
      toast.error('Numero ODP già esistente');
      return;
    }

    try {
      if (editingItem) {
        await updateCutRequest(editingItem.id, data);
        toast.success('Richiesta aggiornata con successo');
        navigate('/requests');
      } else {
        await addCutRequest(data);
        reset();
        setIsAdding(false);
        toast.success('Richiesta aggiunta con successo');
      }
    } catch (error) {
      toast.error('Errore durante il salvataggio: ' + error.message);
    }
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

  const handleEdit = (request) => {
    navigate(`/requests/edit/${request.id}`);
  };

  const handleCancel = () => {
    if (editingItem) {
      navigate('/requests');
    } else {
      setIsAdding(false);
      reset();
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {editingItem ? 'Modifica Richiesta' : 'Richieste di Taglio'}
          </h1>
          <p className="text-gray-600">
            {editingItem ? 'Modifica le informazioni della richiesta' : 'Gestisci gli ordini di taglio con priorità'}
          </p>
        </div>
        {!editingItem && (
          <Button onClick={() => setIsAdding(!isAdding)}>
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi Richiesta
          </Button>
        )}
      </div>

      {/* Add Request Form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>{editingItem ? 'Modifica Richiesta' : 'Nuova Richiesta'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderNumber">Numero ODP *</Label>
                <Input
                  id="orderNumber"
                  placeholder="Es. ODP-2024/120"
                  {...register('orderNumber', { required: true })}
                />
                {errors.orderNumber && <p className="text-sm text-red-600">Numero ODP obbligatorio</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="material">Materiale *</Label>
                <Controller
                  name="material"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona materiale" />
                      </SelectTrigger>
                      <SelectContent>
                        {getMaterialsForSelect().map((material) => (
                          <SelectItem key={material.value} value={material.value}>
                            {material.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.material && <p className="text-sm text-red-600">Materiale obbligatorio</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="width">Larghezza (mm) *</Label>
                <Input
                  id="width"
                  type="number"
                  placeholder="Es. 220"
                  {...register('width', { required: true, min: 1 })}
                />
                {errors.width && <p className="text-sm text-red-600">Larghezza obbligatoria</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="length">Lunghezza (m) *</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.01"
                  placeholder="Es. 2500"
                  {...register('length', { required: true, min: 0.01 })}
                />
                {errors.length && <p className="text-sm text-red-600">Lunghezza obbligatoria</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Priorità *</Label>
                <Controller
                  name="priority"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona priorità" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="normal">Normale</SelectItem>
                        <SelectItem value="low">Bassa</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.priority && <p className="text-sm text-red-600">Priorità obbligatoria</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantità *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  defaultValue="1"
                  placeholder="Es. 1"
                  {...register('quantity', { required: true, min: 1 })}
                />
                {errors.quantity && <p className="text-sm text-red-600">Quantità obbligatoria</p>}
              </div>
              
              <div className="md:col-span-3 flex space-x-2">
                <Button type="submit">
                  {editingItem ? 'Aggiorna' : 'Aggiungi'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Annulla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Richieste Attive ({cutRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={cutRequests}
            columns={[
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
            ]}
            onEditRow={handleEdit}
            onDeleteRow={handleDelete}
            enableGlobalSearch={true}
            enableColumnVisibility={true}
            initialPageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  );
}

