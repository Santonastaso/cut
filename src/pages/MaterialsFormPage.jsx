import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '../components/ui';
import { useMaterialsStore } from '../store';
import { validateMaterial, isMaterialCodeDuplicate } from '../utils/validation';

export default function MaterialsFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { materials, addMaterial, updateMaterial } = useMaterialsStore();
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Fetch data for editing if ID is provided
  useEffect(() => {
    if (id && id !== 'new') {
      setIsLoading(true);
      const material = materials.find(m => m.id === parseInt(id));
      if (material) {
        setEditingItem(material);
        // Pre-fill form with existing data
        reset({
          code: material.code,
          name: material.name,
          specificWeight: material.specificWeight
        });
      } else {
        toast.error('Materiale non trovato');
        navigate('/materials/list');
      }
      setIsLoading(false);
    }
  }, [id, materials, navigate, reset]);

  const onSubmit = async (data) => {
    const validation = validateMaterial(data);
    
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    // Check for duplicate code (exclude current item when editing)
    if (isMaterialCodeDuplicate(data.code, materials, editingItem?.id)) {
      toast.error('Codice materiale già esistente');
      return;
    }

    try {
      if (editingItem) {
        await updateMaterial(editingItem.id, data);
        toast.success('Materiale aggiornato con successo');
        navigate('/materials/list');
      } else {
        await addMaterial(data);
        toast.success('Materiale aggiunto con successo');
        navigate('/materials/list');
      }
    } catch (error) {
      toast.error('Errore durante il salvataggio: ' + error.message);
    }
  };

  const handleCancel = () => {
    navigate('/materials/list');
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
            {editingItem ? 'Modifica Materiale' : 'Nuovo Materiale'}
          </h1>
          <p className="text-gray-600">
            {editingItem ? 'Modifica le informazioni del materiale' : 'Aggiungi un nuovo materiale al catalogo'}
          </p>
        </div>
        <Button variant="outline" onClick={handleCancel}>
          Annulla
        </Button>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informazioni Materiale</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Codice *</Label>
              <Input
                id="code"
                placeholder="Es. ITXBI"
                {...register('code', { required: true })}
              />
              {errors.code && <p className="text-sm text-red-600">Codice obbligatorio</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                placeholder="Es. Triplex Bianco"
                {...register('name', { required: true })}
              />
              {errors.name && <p className="text-sm text-red-600">Nome obbligatorio</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="specificWeight">Peso Specifico (g/m²) *</Label>
              <Input
                id="specificWeight"
                type="number"
                step="0.01"
                placeholder="Es. 121.10"
                {...register('specificWeight', { required: true, min: 0.01 })}
              />
              {errors.specificWeight && <p className="text-sm text-red-600">Peso specifico obbligatorio</p>}
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

