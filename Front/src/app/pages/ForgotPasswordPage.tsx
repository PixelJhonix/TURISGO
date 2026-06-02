import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { apiClient } from '../lib/api/client';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [resetLink, setResetLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Ingresa tu correo electrónico'); return; }
    try {
      setLoading(true);
      const res = await apiClient.post<{ resetToken: string; expiresAt: string; message: string }>(
        '/auth/forgot-password', { email }
      );
      if (res.resetToken) {
        setResetLink(`${window.location.origin}/reset-password?token=${res.resetToken}`);
      } else {
        toast.success(res.message);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resetLink);
    setCopied(true);
    toast.success('Enlace copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center space-x-2">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1A6B4A' }}>
            <span className="text-white font-bold text-2xl">T</span>
          </div>
          <span className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display', color: '#1A6B4A' }}>
            TuristGo
          </span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Recuperar contraseña</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {resetLink ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                Se generó un enlace de recuperación válido por 30 minutos. En producción se enviaría por correo:
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 break-all">
                {resetLink}
              </div>
              <Button className="w-full" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Copiado' : 'Copiar enlace'}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => { setResetLink(''); setEmail(''); }}>
                Enviar otro enlace
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-6">
                Ingresa tu correo y generaremos un enlace para restablecer tu contraseña.
              </p>
              <form className="space-y-6" onSubmit={handleSendLink}>
                <div>
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Procesando...' : 'Generar enlace de recuperación'}
                </Button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/90">
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
