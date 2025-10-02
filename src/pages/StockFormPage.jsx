import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui';
import { useStockStore, useMaterialsStore } from '../store';
import { validateStockRoll, isStockCodeDuplicate } from '../utils/validation';

export default function StockFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { stockRolls, addStockRoll, updateStockRoll } = useStockStore();
  const { materials, getMaterialsForSelect } = useMaterialsStore();
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Fetch data for editing if ID is provided
  useEffect(() => {
    if (id && id !== 'new') {
      setIsLoading(true);
      const roll = stockRolls.find(r => r.id === parseInt(id));
      if (roll) {
        setEditingItem(roll);
        // Pre-fill form with existing data
        reset({
          code: roll.code,
          material: roll.material,
          width: roll.width,
          length: roll.length,
          batch: roll.batch
        });
      } else {
        toast.error('Bobina non trovata');
        navigate('/stock/list');
      }
      setIsLoading(false);
    }
  }, [id, stockRolls, navigate, reset]);

  const onSubmit = async (data) => {
    const validation = validateStockRoll(data);
    
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    // Check for duplicate code (exclude current item when editing)
    if (isStockCodeDuplicate(data.code, stockRolls, editingItem?.id)) {
      toast.error('Codice bobina già esistente');
      return;
    }

    const material = materials.find(m => m.code === data.material);
    if (!material) {
      toast.error('Materiale non valido');
      return;
    }

    try {
      const rollData = {
        ...data,
        specificWeight: material.specificWeight,
        batch: data.batch || `2024/${Math.floor(Math.random() * 900) + 100}`
      };

      if (editingItem) {
        await updateStockRoll(editingItem.id, rollData);
        toast.success('Bobina aggiornata con successo');
        navigate('/stock/list');
      } else {
        await addStockRoll(rollData);
        toast.success('Bobina aggiunta con successo');
        navigate('/stock/list');
      }
    } catch (error) {
      toast.error('Errore durante il salvataggio: ' + error.message);
    }
  };

  const handleCancel = () => {
    navigate('/stock/list');
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
            {editingItem ? 'Modifica Bobina' : 'Nuova Bobina'}
          </h1>
          <p className="text-gray-600">
            {editingItem ? 'Modifica le informazioni della bobina' : 'Aggiungi una nuova bobina al magazzino'}
          </p>
        </div>
        <Button variant="outline" onClick={handleCancel}>
          Annulla
        </Button>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informazioni Bobina</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Codice Bobina *</Label>
              <Input
                id="code"
                placeholder="Es. ITXBI1000"
                {...register('code', { required: true })}
              />
              {errors.code && <p className="text-sm text-red-600">Codice obbligatorio</p>}
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
                placeholder="Es. 5000"
                {...register('length', { required: true, min: 0.01 })}
              />
              {errors.length && <p className="text-sm text-red-600">Lunghezza obbligatoria</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="batch">Lotto</Label>
              <Input
                id="batch"
                placeholder="Es. 2024/03/001"
                {...register('batch')}
              />
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

