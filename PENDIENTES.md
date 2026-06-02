# Pendientes de implementación — TuristGo
**Actualizado:** 2026-06-02  
**Commits relevantes de sesión anterior:** `3f52b50` `3b3bf25` `1f9c16d` `f92838e`

Cada pendiente tiene: qué archivos tocar, qué crear, pseudocódigo/estructura y criterio de verificación.

---

## HU-52 — Descarga de factura en PDF

**Complejidad:** Baja · **Tiempo estimado:** 20 min · **Sin migración EF**

### Problema
`TouristInvoicesPage.tsx` tiene un botón "Descargar" que llama `toast.success` en lugar de imprimir.  
El CSS `@media print` ya existe en `Front/src/styles/index.css` pero el `id="invoice-print-area"` no está asignado al contenedor del modal.

### Archivos a modificar
- `Front/src/app/pages/tourist/TouristInvoicesPage.tsx`

### Qué hacer

1. Leer el archivo para localizar el `div` raíz del contenido de la factura dentro del modal de preview.
2. Agregar `id="invoice-print-area"` a ese `div`.
3. Localizar el botón "Descargar" y reemplazar su `onClick` por:
   ```typescript
   onClick={() => window.print()}
   ```
4. Asegurarse de que el overlay del modal no oculte el área de impresión — el CSS ya tiene:
   ```css
   @media print {
     body > *:not(#invoice-print-area) { display: none !important; }
     #invoice-print-area { display: block !important; }
   }
   ```
   Si el `#invoice-print-area` está anidado dentro del modal (no hijo directo de `body`), usar en su lugar:
   ```css
   @media print {
     body * { visibility: hidden; }
     #invoice-print-area, #invoice-print-area * { visibility: visible; }
     #invoice-print-area { position: fixed; top: 0; left: 0; width: 100%; }
   }
   ```

### Verificación
- Abrir la página de facturas del turista → click en "Ver" → click "Descargar" → debe abrirse el diálogo de impresión del navegador mostrando solo el contenido de la factura.

---

## HU-41 — Turistas inscritos en tour (vista guía)

**Complejidad:** Baja · **Tiempo estimado:** 30 min · **Sin migración EF**

### Problema
`GuideToursPage.tsx` tiene un modal "Ver turistas" que solo muestra el recuento de cupos. No hay endpoint para obtener el listado de turistas de un tour específico.

### Archivos a modificar
- `back/TuristGo.API/Controllers/GuideController.cs`
- `Front/src/app/pages/guide/GuideToursPage.tsx`

### Backend — nuevo endpoint

En `GuideController.cs`, agregar después del método `GetTours`:

```csharp
// HU-41: turistas inscritos en un tour del guía
[HttpGet("tours/{tourId:int}/tourists")]
public async Task<ActionResult> GetTouristsInTour(int tourId, ITourRepository tourRepo)
{
    var guideId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
    var tour = await tourRepo.GetByIdAsync(tourId);
    if (tour is null || tour.GuideId != guideId) return Forbid();

    var reservations = await reservationRepo.GetByTourAsync(tourId); // ver nota abajo
    var result = reservations
        .Where(r => r.Status == ReservationStatus.Confirmed)
        .Select(r => new { r.Id, TouristName = r.Tourist?.FullName ?? "", r.TourDate });
    return Ok(result);
}
```

> **Nota:** `IReservationRepository` no tiene `GetByTourAsync`. Hay dos opciones:
> - Añadir el método a la interfaz y al repositorio (recomendado).
> - Inyectar `TuristGoDbContext` directamente en el controller como alternativa rápida.
>
> Si se añade al repositorio, agregar en `IReservationRepository.cs`:
> ```csharp
> Task<IEnumerable<Reservation>> GetByTourAsync(int tourId);
> ```
> Y en `ReservationRepository.cs`:
> ```csharp
> public async Task<IEnumerable<Reservation>> GetByTourAsync(int tourId)
>     => await context.Reservations
>         .Include(r => r.Tourist)
>         .Where(r => r.TourId == tourId)
>         .ToListAsync();
> ```

También necesita inyectar `IReservationRepository` en `GuideController`. Cambiar el constructor:
```csharp
public class GuideController(
    ITourRepository tourRepository,
    IReservationRepository reservationRepo,        // ← agregar
    IGenericRepository<GuideUnavailability> unavailabilityRepo) : ControllerBase
```

### Frontend — actualizar modal

En `GuideToursPage.tsx`:
1. Agregar estado: `const [touristList, setTouristList] = useState<{id:number, touristName:string, tourDate:string}[]>([])`.
2. Al abrir el modal de turistas, llamar `GET /guide/tours/{tourId}/tourists` y guardar en `touristList`.
3. Reemplazar el contenido del modal (que solo muestra conteo) por una tabla con `touristName` y `tourDate`.

### Verificación
- Iniciar sesión con `guide1.1@turistgo.com` → Mis Tours → "Ver turistas" en TG-AND-001 → debe listar los turistas con reserva confirmada.

---

## HU-43 — Cambio de fecha de reserva

**Complejidad:** Media · **Tiempo estimado:** 45 min · **Sin migración EF**

### Problema
`TouristReservationDetailPage.tsx` tiene el botón "Cambiar fecha" en el JSX sin handler ni modal. No existe el método `RescheduleBookingAsync` en `IReservationFacade` ni el endpoint `PATCH /reservation/{id}/reschedule`.

### Archivos a modificar
- `back/TuristGo.Domain/Interfaces/Services/IReservationFacade.cs`
- `back/TuristGo.Domain/Services/Facades/ReservationFacade.cs`
- `back/TuristGo.API/DTOs/Request/` → crear `RescheduleRequestDTO.cs`
- `back/TuristGo.API/Controllers/ReservationController.cs`
- `Front/src/app/lib/api/services/reservationService.ts`
- `Front/src/app/pages/tourist/TouristReservationDetailPage.tsx`

### Backend

**`RescheduleRequestDTO.cs`** (crear):
```csharp
namespace TuristGo.API.DTOs;
public record RescheduleRequestDTO(string NewDate);
```

**`IReservationFacade.cs`** — agregar método:
```csharp
Task<Reservation> RescheduleBookingAsync(int reservationId, int touristId, DateOnly newDate);
```

**`ReservationFacade.cs`** — implementar:
```csharp
public async Task<Reservation> RescheduleBookingAsync(int reservationId, int touristId, DateOnly newDate)
{
    var reservation = await reservationRepository.GetByIdAsync(reservationId)
        ?? throw new KeyNotFoundException("Reserva no encontrada.");
    if (reservation.TouristId != touristId)
        throw new UnauthorizedAccessException("La reserva no pertenece a este usuario.");
    if (reservation.Status != ReservationStatus.Confirmed)
        throw new InvalidOperationException("Solo se pueden reprogramar reservas confirmadas.");
    // Ventana 24h sobre la fecha ORIGINAL
    var originalStart = reservation.TourDate.ToDateTime(reservation.StartTime ?? TimeOnly.MinValue);
    if (originalStart <= DateTime.UtcNow.AddHours(24))
        throw new InvalidOperationException("Solo puedes cambiar la fecha con más de 24 horas de anticipación.");
    if (newDate <= DateOnly.FromDateTime(DateTime.UtcNow))
        throw new InvalidOperationException("La nueva fecha debe ser futura.");
    reservation.TourDate = newDate;
    await reservationRepository.UpdateAsync(reservation);
    return reservation;
}
```

**`ReservationController.cs`** — agregar endpoint:
```csharp
[HttpPatch("{id:int}/reschedule")]
[Authorize(Roles = "Tourist")]
public async Task<ActionResult> Reschedule(int id, [FromBody] RescheduleRequestDTO dto)
{
    var touristId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
    var newDate = DateOnly.Parse(dto.NewDate);
    await facade.RescheduleBookingAsync(id, touristId, newDate);
    return Ok(new { message = "Fecha de reserva actualizada." });
}
```

### Frontend

**`reservationService.ts`** — agregar función:
```typescript
export async function rescheduleReservationApi(id: number, newDate: string) {
  return apiClient.patch(`/reservation/${id}/reschedule`, { newDate });
}
```

**`TouristReservationDetailPage.tsx`** — agregar estado y modal:
```typescript
const [showReschedule, setShowReschedule] = useState(false);
const [newDate, setNewDate] = useState('');

const handleReschedule = async () => {
  if (!newDate) { toast.error('Selecciona una fecha'); return; }
  try {
    await rescheduleReservationApi(reservation.id, newDate);
    toast.success('Fecha actualizada');
    setShowReschedule(false);
    // recargar reserva
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Error al cambiar la fecha');
  }
};
```
Agregar un modal sencillo con `<input type="date" min={mañana}>` y botón confirmar. Conectar el botón "Cambiar fecha" existente a `setShowReschedule(true)`.

### Verificación
- Login `tourist@turistgo.com` → reserva R01 (en 30 días, cancelable) → "Cambiar fecha" → seleccionar fecha futura → confirmar → toast "Fecha actualizada".
- Reserva R03 (en <24h) → "Cambiar fecha" → debe mostrar error "Solo puedes cambiar la fecha con más de 24 horas de anticipación".

---

## HU-47 — Factura manual de agencia

**Complejidad:** Media · **Tiempo estimado:** 60 min · **Requiere migración EF**

### Problema
La entidad `Invoice` no tiene campos `IsManual` ni `ManualDescription`. No existe el endpoint `POST /invoice/agency/manual`. `AgencyInvoicesPage.tsx` no tiene el botón "Emitir factura manual".

### Archivos a modificar/crear
- `back/TuristGo.Domain/Entities/Invoice.cs`
- `back/TuristGo.Domain/Interfaces/Repositories/IInvoiceRepository.cs`
- `back/TuristGo.DataAccess/Repositories/InvoiceRepository.cs`
- `back/TuristGo.API/DTOs/Request/` → crear `ManualInvoiceRequestDTO.cs`
- `back/TuristGo.API/Controllers/InvoiceController.cs`
- `Front/src/app/lib/api/services/invoiceService.ts`
- `Front/src/app/pages/agency/AgencyInvoicesPage.tsx`

### Backend

**`Invoice.cs`** — agregar campos:
```csharp
public bool IsManual { get; set; }
public string? ManualDescription { get; set; }
```

**Migración EF** (ejecutar desde `back/`):
```powershell
dotnet ef migrations add AddInvoiceManualFields --project TuristGo.DataAccess --startup-project TuristGo.API
```

**`ManualInvoiceRequestDTO.cs`** (crear):
```csharp
namespace TuristGo.API.DTOs;
public record ManualInvoiceRequestDTO(int ReservationId, decimal Amount, string Description);
```

**`IInvoiceRepository.cs`** — agregar método:
```csharp
Task<Invoice> CreateManualAsync(int agencyId, int reservationId, decimal amount, string description);
```

**`InvoiceRepository.cs`** — implementar:
```csharp
public async Task<Invoice> CreateManualAsync(int agencyId, int reservationId, decimal amount, string description)
{
    // Validar que la reserva pertenece a un tour de la agencia
    var reservation = await context.Reservations
        .Include(r => r.Tour)
        .FirstOrDefaultAsync(r => r.Id == reservationId && r.Tour!.AgencyId == agencyId)
        ?? throw new UnauthorizedAccessException("La reserva no pertenece a esta agencia.");
    var invoice = new Invoice
    {
        ReservationId = reservationId,
        Amount = amount,
        Status = InvoiceStatus.Active,
        IsManual = true,
        ManualDescription = description,
    };
    context.Invoices.Add(invoice);
    await context.SaveChangesAsync();
    return invoice;
}
```

**`InvoiceController.cs`** — agregar endpoint:
```csharp
[HttpPost("agency/manual")]
[Authorize(Roles = "Agency")]
public async Task<ActionResult> CreateManual([FromBody] ManualInvoiceRequestDTO dto)
{
    var agencyId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
    if (string.IsNullOrWhiteSpace(dto.Description))
        throw new ArgumentException("La descripción es obligatoria para facturas manuales.");
    if (dto.Amount <= 0)
        throw new ArgumentException("El monto debe ser mayor a cero.");
    var invoice = await invoiceRepo.CreateManualAsync(agencyId, dto.ReservationId, dto.Amount, dto.Description);
    return Ok(new { invoice.Id, message = "Factura manual emitida." });
}
```

> Verificar que `invoiceRepo` esté inyectado en el constructor de `InvoiceController`. Si usa `IInvoiceRepository`, el método `CreateManualAsync` ya debe estar en la interfaz.

### Frontend

**`invoiceService.ts`** — agregar función:
```typescript
export async function createManualInvoiceApi(reservationId: number, amount: number, description: string) {
  return apiClient.post('/invoice/agency/manual', { reservationId, amount, description });
}
```

**`AgencyInvoicesPage.tsx`** — agregar botón y diálogo:
1. Agregar estado `showManualModal`, `manualForm = { reservationId: '', amount: '', description: '' }`.
2. Botón "Emitir factura manual" (variant outline) junto a los filtros actuales.
3. Modal con tres campos: ID de reserva (number), monto (number), descripción (textarea).
4. Al confirmar: llama `createManualInvoiceApi` → toast → recarga la lista.
5. En la columna "Tipo" de la tabla existente: mostrar chip "Manual" si `isManual === true`, "Automática" si no.

> **Nota:** el campo `isManual` debe añadirse al tipo `ApiInvoiceAgency` y al DTO `InvoiceAgencyResponseDTO` en el backend para que llegue al frontend. Agregar `bool IsManual` a `InvoiceAgencyResponseDTO.cs` y mapearlo en `InvoiceController.GetAgencyInvoices`.

### Verificación
- Login `andes@turistgo.com` → Facturas → "Emitir factura manual" → ingresar ReservationId válido, monto y descripción → confirmar → aparece en la tabla con columna "Manual".

---

## HU-15 — Recuperar contraseña

**Complejidad:** Alta · **Tiempo estimado:** 90 min · **Sin migración EF** (campos ya existen en `User.cs`)

### Problema
No existe ningún endpoint de recuperación de contraseña. `ForgotPasswordPage.tsx` solo muestra un Alert estático. No existe `ResetPasswordPage.tsx` ni la ruta `/reset-password`.

Los campos `PasswordResetToken` y `PasswordResetTokenExpiry` **ya existen** en `back/TuristGo.Domain/Entities/User.cs` y en la BD — no requieren migración.

### Archivos a modificar/crear
- `back/TuristGo.API/DTOs/Request/` → crear `ForgotPasswordRequestDTO.cs` y `ResetPasswordRequestDTO.cs`
- `back/TuristGo.API/DTOs/Response/` → crear `ForgotPasswordResponseDTO.cs`
- `back/TuristGo.API/Controllers/AuthController.cs`
- `Front/src/app/pages/ForgotPasswordPage.tsx`
- `Front/src/app/pages/ResetPasswordPage.tsx` (crear nuevo)
- `Front/src/app/routes.tsx`

### Backend

**DTOs a crear:**
```csharp
// ForgotPasswordRequestDTO.cs
public record ForgotPasswordRequestDTO(string Email);

// ResetPasswordRequestDTO.cs
public record ResetPasswordRequestDTO(string Token, string NewPassword);

// ForgotPasswordResponseDTO.cs
public record ForgotPasswordResponseDTO(string ResetToken, string ExpiresAt, string Message);
```

**Helper SHA-256** (crear en `back/TuristGo.Domain/Services/` como clase estática):
```csharp
// HashHelper.cs
using System.Security.Cryptography;
using System.Text;

public static class HashHelper
{
    public static string Sha256(string input)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(input))).ToLower();
}
```

**`AuthController.cs`** — agregar dos endpoints:

```csharp
[HttpPost("forgot-password")]
[AllowAnonymous]
public async Task<ActionResult<ForgotPasswordResponseDTO>> ForgotPassword(
    [FromBody] ForgotPasswordRequestDTO dto,
    [FromServices] IUserRepository userRepo,
    [FromServices] IGenericRepository<User> userStore)
{
    // Responder igual si el email no existe (no revelar datos)
    var user = await userRepo.GetByEmailAsync(dto.Email);
    if (user is null)
        return Ok(new ForgotPasswordResponseDTO("", "", "Si el correo está registrado recibirás instrucciones."));

    var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)); // 64 chars hex
    user.PasswordResetToken = HashHelper.Sha256(token);
    user.PasswordResetTokenExpiry = DateTime.UtcNow.AddMinutes(30);
    await userStore.UpdateAsync(user);

    var expiresAt = user.PasswordResetTokenExpiry.Value.ToString("yyyy-MM-ddTHH:mm:ssZ");
    // En dev: el token se retorna en JSON. En producción iría por email.
    return Ok(new ForgotPasswordResponseDTO(token, expiresAt, "Token generado. En producción se enviará por correo."));
}

[HttpPost("reset-password")]
[AllowAnonymous]
public async Task<ActionResult> ResetPassword(
    [FromBody] ResetPasswordRequestDTO dto,
    [FromServices] IGenericRepository<User> userStore)
{
    // Buscar usuario con token no expirado
    var allUsers = await userStore.GetAllAsync();
    var user = allUsers.FirstOrDefault(u =>
        u.PasswordResetTokenExpiry > DateTime.UtcNow &&
        u.PasswordResetToken == HashHelper.Sha256(dto.Token));

    if (user is null)
        throw new ArgumentException("El enlace de recuperación es inválido o ha expirado.");

    // Reusar validación de contraseña
    if (dto.NewPassword.Length < 8 ||
        !dto.NewPassword.Any(char.IsUpper) ||
        !dto.NewPassword.Any(char.IsDigit))
        throw new ArgumentException("La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.");

    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
    user.PasswordResetToken = null;
    user.PasswordResetTokenExpiry = null;
    await userStore.UpdateAsync(user);
    return Ok(new { message = "Contraseña actualizada correctamente." });
}
```

### Frontend

**`ForgotPasswordPage.tsx`** — reemplazar el handler actual:
```typescript
const [resetLink, setResetLink] = useState('');

const handleSendLink = async () => {
  if (!email) { toast.error('Ingresa tu correo'); return; }
  try {
    const res = await apiClient.post<{ resetToken: string; expiresAt: string; message: string }>(
      '/auth/forgot-password', { email }
    );
    if (res.resetToken) {
      const link = `${window.location.origin}/reset-password?token=${res.resetToken}`;
      setResetLink(link);
    } else {
      toast.success(res.message);
    }
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Error');
  }
};
```
Si `resetLink` tiene valor, mostrar un panel con el link y botón "Copiar enlace" (`navigator.clipboard.writeText(resetLink)`). Quitar el Alert estático del MVP.

**`ResetPasswordPage.tsx`** (crear desde cero):
```typescript
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleReset = async () => {
    if (newPassword !== confirm) { toast.error('Las contraseñas no coinciden'); return; }
    try {
      await apiClient.post('/auth/reset-password', { token, newPassword });
      toast.success('Contraseña actualizada. Inicia sesión.');
      navigate('/login');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };
  // ... render: form con dos inputs + botón
}
```
Necesita `import { useSearchParams } from 'react-router'`.

**`routes.tsx`** — agregar ruta:
```typescript
import { ResetPasswordPage } from './pages/ResetPasswordPage';
// ...
{ path: '/reset-password', element: <ResetPasswordPage /> },
```

### Verificación
1. Ir a `/recuperar-contrasena` → ingresar email de turista → aparece el enlace de reset.
2. Abrir el enlace `/reset-password?token=xxx` → ingresar nueva contraseña → redirige a `/login`.
3. Iniciar sesión con la nueva contraseña → debe funcionar.
4. Intentar usar el mismo enlace de nuevo → debe devolver "inválido o expirado".

---

## Checklist final antes del push

Después de implementar todo:

- [ ] `dotnet build` en `back/` → 0 errores
- [ ] `npm run build` en `Front/` → 0 errores  
- [ ] Eliminar BD y arrancar backend → seeder crea datos sin errores
- [ ] Probar PDF: turista → Facturas → Ver → Descargar → diálogo de impresión
- [ ] Probar reschedule: R01 → Cambiar fecha a +7 días → confirmado
- [ ] Probar reschedule bloqueado: R03 (<24h) → debe rechazar
- [ ] Probar factura manual: agencia → Facturas → Emitir manual → aparece en tabla
- [ ] Probar recuperar contraseña: flujo completo forgot → reset → login
- [ ] Probar turistas en tour: guía → Mis Tours → Ver turistas → lista real
- [ ] Crear commit por feature y push final a `master`
