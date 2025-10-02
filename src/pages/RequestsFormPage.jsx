import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui';
import { useRequestsStore, useMaterialsStore } from '../store';
import { validateCutRequest, isOrderNumberDuplicate } from '../utils/validation';

export default function RequestsFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cutRequests, addCutRequest, updateCutRequest } = useRequestsStore();
  const { materials, getMaterialsForSelect } = useMaterialsStore();
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Fetch data for editing if ID is provided
  useEffect(() => {
    if (id && id !== 'new') {
      setIsLoading(true);
      const request = cutRequests.find(r => r.id === parseInt(id));
      if (request) {
        setEditingItem(request);
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
        navigate('/requests/list');
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
        navigate('/requests/list');
      } else {
        await addCutRequest(data);
        toast.success('Richiesta aggiunta con successo');
        navigate('/requests/list');
      }
    } catch (error) {
      toast.error('Errore durante il salvataggio: ' + error.message);
    }
  };

  const handleCancel = () => {
    navigate('/requests/list');
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
            {editingItem ? 'Modifica Richiesta' : 'Nuova Richiesta'}
          </h1>
          <p className="text-gray-600">
            {editingItem ? 'Modifica le informazioni della richiesta' : 'Aggiungi una nuova richiesta di taglio'}
          </p>
        </div>
        <Button variant="outline" onClick={handleCancel}>
          Annulla
        </Button>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informazioni Richiesta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderNumber">Numero ODP *</Label>
              <Input
                id="orderNumber"
                placeholder="Es. 2024/03/001"
                {...register('orderNumber', { required: true })}
              />
              {errors.orderNumber && <p className="text-sm text-red-600">Numero ODP obbligatorio</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="material">Materiale *</Label>
              <Select {...register('material', { required: true })}>
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
              {errors.material && <p className="text-sm text-red-600">Materiale obbligatorio</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="width">Larghezza (mm) *</Label>
              <Input
                id="width"
                type="number"
                placeholder="Es. 1000"
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
                placeholder="Es. 1000"
                {...register('length', { required: true, min: 0.01 })}
              />
              {errors.length && <p className="text-sm text-red-600">Lunghezza obbligatoria</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priorità *</Label>
              <Select {...register('priority', { required: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona priorità" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Bassa</SelectItem>
                  <SelectItem value="2">Media</SelectItem>
                  <SelectItem value="3">Alta</SelectItem>
                  <SelectItem value="4">Urgente</SelectItem>
                </SelectContent>
              </Select>
              {errors.priority && <p className="text-sm text-red-600">Priorità obbligatoria</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantità *</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Es. 100"
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
    </div>
  );
}

