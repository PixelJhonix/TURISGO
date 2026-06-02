import { useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Sidebar } from '../../components/Sidebar';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { useAuth } from '../../lib/auth';
import { apiClient } from '../../lib/api/client';

export function AgencyCreateTourPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [btnError, setBtnError] = useState(false);

  const triggerBtnError = () => {
    setBtnError(true);
    setTimeout(() => setBtnError(false), 500);
  };
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    city: 'Medellín',
    price: '',
    maxCapacity: '',
    duration: '',
    meetingPoint: '',
    date: '',
    time: '',
    imageUrl: '',
  });
  
  if (!isAuthenticated || user?.role !== 'Agencia') {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async () => {
    if (!form.name || !form.description || !form.category || !form.price ||
        !form.maxCapacity || !form.duration || !form.meetingPoint || !form.date || !form.time) {
      toast.error('Todos los campos son obligatorios.');
      triggerBtnError();
      return;
    }
    if (Number(form.price) <= 0) { toast.error('El precio debe ser mayor a cero.'); triggerBtnError(); return; }
    if (Number(form.maxCapacity) <= 0) { toast.error('Los cupos deben ser mayor a cero.'); triggerBtnError(); return; }

    try {
      setSaving(true);
      const startTime = new Date(`${form.date}T${form.time}:00`).toISOString();
      const result = await apiClient.post<{ id: number; code: string; message: string }>('/tour', {
        name: form.name,
        description: form.description,
        category: form.category,
        city: form.city,
        price: Number(form.price),
        totalCapacity: Number(form.maxCapacity),
        startTime,
        durationMinutes: Number(form.duration) * 60,
        meetingPoint: form.meetingPoint,
        imageUrl: form.imageUrl || null,
      });
      toast.success(`Tour creado con código ${result.code}. Asigna un guía para activarlo.`);
      navigate('/agencia/tours');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al crear el tour');
      triggerBtnError();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar variant="agency" />
      <div className="flex-1 overflow-auto p-8">
        <Link to="/agencia/tours" className="text-primary hover:underline mb-4 inline-block">
          ← Volver
        </Link>
        <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Playfair Display' }}>
          Crear Nuevo Tour
        </h1>
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-3xl">
          <div className="space-y-6">
            <div>
              <Label>Nombre del tour</Label>
              <Input 
                placeholder="Ej: Tour Centro Histórico" 
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea 
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoría</Label>
                <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cultura">Cultura</SelectItem>
                    <SelectItem value="Aventura">Aventura</SelectItem>
                    <SelectItem value="Gastronomía">Gastronomía</SelectItem>
                    <SelectItem value="Naturaleza">Naturaleza</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ciudad</Label>
                <Input 
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Precio (COP)</Label>
                <Input 
                  type="number" 
                  placeholder="80000"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div>
                <Label>Cupos máximos</Label>
                <Input 
                  type="number" 
                  placeholder="15"
                  value={form.maxCapacity}
                  onChange={(e) => setForm({ ...form, maxCapacity: e.target.value })}
                />
              </div>
              <div>
                <Label>Duración (horas)</Label>
                <Input 
                  type="number" 
                  placeholder="4"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Punto de encuentro</Label>
              <Input 
                placeholder="Plaza Botero, Centro"
                value={form.meetingPoint}
                onChange={(e) => setForm({ ...form, meetingPoint: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha del tour</Label>
                <Input
                  type="date"
                  value={form.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora del tour</Label>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>URL de imagen (opcional)</Label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
              {form.imageUrl && (
                <img
                  src={form.imageUrl}
                  alt="Vista previa"
                  className="mt-2 h-32 w-full object-cover rounded-lg"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
            </div>
            <Button onClick={handleSubmit} disabled={saving} className={btnError ? 'btn-error' : ''}>
              {saving ? 'Guardando...' : 'Guardar tour'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}