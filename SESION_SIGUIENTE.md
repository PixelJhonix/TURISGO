# Sesión siguiente — TuristGo: implementar funciones pendientes

## Contexto del proyecto

**Repo:** https://github.com/PixelJhonix/TURISGO.git — rama `master`  
**Directorio local:** `C:\repositories\TuristGo`  
**Arquitectura:** Monorepo. Backend en `back/` (ASP.NET Core 10, N capas), frontend en `Front/` (React 18 + Vite + TypeScript).

### Estructura de capas backend

```
back/
├── TuristGo.API/          ← Controllers, DTOs, Middlewares, Program.cs
├── TuristGo.Domain/       ← Entities, Enums, Interfaces, Services (GoF)
└── TuristGo.DataAccess/   ← DbContext EF Core, Repositories, Migrations, Seeders
```

### Stack completo

- **Backend:** .NET 10, Entity Framework Core, SQL Server LocalDB, JWT (BCrypt), AutoMapper
- **Frontend:** React 18, React Router 7, Tailwind CSS, shadcn/ui, Vite
- **Patrones GoF implementados:** Factory (3), Strategy (4), Observer (5), Facade, Builder (3 por rol + Director)
- **Base de datos:** se crea automáticamente al correr el backend (`MigrateAsync` + `DataSeeder`)

### Cómo correr el proyecto

**Terminal 1 — Backend:**
```powershell
cd C:\repositories\TuristGo\back
dotnet run --project TuristGo.API
# Queda en http://localhost:5142 — Swagger en http://localhost:5142/swagger
```

**Terminal 2 — Frontend:**
```powershell
cd C:\repositories\TuristGo\Front
npm install          # solo primera vez
copy .env.example .env   # si no existe Front/.env
npm run dev
# Queda en http://localhost:5173
```

### Credenciales seed (ya están en la BD al arrancar)

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@turistgo.com | Admin123! |
| Agencia | andes@turistgo.com | Agency123! |
| Turista | tourist@turistgo.com | Tourist123! |
| Guía | guide1.2@turistgo.com | Guide123! |

---

## Estado actual del MVP (lo que YA está implementado)

Las 28 pantallas del frontend están conectadas a la API real. Los patrones GoF del diagrama `TuristGo_Merge_Completo.puml` están todos implementados. No hay archivos huérfanos ni handlers sin API. La última auditoría de código confirmó 0 errores de compilación en back y front.

**Commits relevantes de esta sesión:**
- `6190caf` — fix: código muerto, handlers sin API, toursStorage eliminado
- `c9bd9bb` — fix: dashboards y TouristReservationDetailPage a API real
- `0b4cc89` — feat(fase-d): facturación, reporte admin, calificaciones, GoF completos
- `994de79` — feat(fase-c): agencia, guía, turista — cero mocks
- `ba97a05` — feat(fase-0): estructura base monorepo

---

## Lo que falta implementar en esta sesión

Son 5 features pendientes del Entregable 3. Ya se decidió la opción para cada uno. El objetivo es implementarlos todos, hacer commit por feature, y al final generar un documento `.md` de decisiones técnicas.

---

### Feature 1 — HU-15: Recuperar contraseña (token hasheado en BD)

**Historia de usuario:** El turista puede solicitar recuperar su contraseña. El sistema genera un token con expiración de 30 minutos. Como no hay servidor SMTP en desarrollo, el token se retorna en la respuesta JSON y el frontend lo muestra en pantalla como un "enlace copiable".

**Decisión técnica:** Token hasheado (SHA-256) en BD. El token en claro se retorna al front. Al validar, se compara `SHA256(tokenRecibido) == hashGuardado`. Single-use: el token se nulifica al usarse.

**Lo que hay que hacer:**

**Backend — `back/TuristGo.API/Controllers/AuthController.cs`:**
- Agregar `POST /auth/forgot-password` con body `{ email }`:
  - Busca usuario por email con `userRepo.GetByEmailAsync`
  - Si no existe → responde igual que si existiera (no revelar si el email está registrado)
  - Genera token: `Convert.ToHexString(RandomNumberGenerator.GetBytes(32))` (64 chars hex)
  - Guarda en BD: `user.PasswordResetToken = SHA256Hash(token)`, `user.PasswordResetTokenExpiry = DateTime.UtcNow.AddMinutes(30)`
  - Devuelve `{ resetToken: token, expiresAt: "..." }` — en producción esto iría por email
- Agregar `POST /auth/reset-password` con body `{ token, newPassword }`:
  - Busca usuario donde `PasswordResetTokenExpiry > now`
  - Compara `SHA256(token) == user.PasswordResetToken`
  - Si inválido/expirado → 400
  - Si contraseña débil → 400 (reusar validación de `TouristFactory`)
  - Actualiza `PasswordHash`, nulifica `PasswordResetToken` y `PasswordResetTokenExpiry`

**Helper SHA-256** (crear en `back/TuristGo.Domain/Services/`):
```csharp
using System.Security.Cryptography;
using System.Text;
public static string Sha256(string input)
    => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(input))).ToLower();
```

**Frontend — `Front/src/app/pages/ForgotPasswordPage.tsx`:**
- El form ya existe. Cambiar `handleSendLink` para llamar `POST /auth/forgot-password`
- Si la respuesta trae `resetToken`: mostrar un panel con el link `/reset-password?token=xxx` y botón "Copiar enlace"
- Crear nueva página `Front/src/app/pages/ResetPasswordPage.tsx`:
  - Lee `?token=` de la URL
  - Form con `newPassword` + `confirmPassword`
  - Llama `POST /auth/reset-password`
  - Al éxito redirige a `/login`
- Agregar la ruta `/reset-password` en `Front/src/app/routes.tsx`

**DTOs a crear:**
- `back/TuristGo.API/DTOs/Request/ForgotPasswordRequestDTO.cs` → `record(string Email)`
- `back/TuristGo.API/DTOs/Request/ResetPasswordRequestDTO.cs` → `record(string Token, string NewPassword)`
- `back/TuristGo.API/DTOs/Response/ForgotPasswordResponseDTO.cs` → `record(string ResetToken, string ExpiresAt, string Message)`

**Migración EF:** No es necesaria — los campos `PasswordResetToken` y `PasswordResetTokenExpiry` ya existen en `User.cs` y están en la BD.

---

### Feature 2 — HU-43: Cambio de fecha de reserva

**Historia de usuario:** El turista puede cambiar la fecha de una reserva confirmada, siempre que falten más de 24 horas para el tour original.

**Lo que hay que hacer:**

**Backend:**
- En `back/TuristGo.Domain/Interfaces/Services/IReservationFacade.cs` agregar:
  ```csharp
  Task<Reservation> RescheduleBookingAsync(int reservationId, int touristId, DateOnly newDate);
  ```
- En `back/TuristGo.Domain/Services/Facades/ReservationFacade.cs` implementar `RescheduleBookingAsync`:
  - Busca reserva, valida que pertenezca al turista
  - Valida que la reserva sea `Confirmed`
  - Valida `>24h` hasta la fecha actual del tour (misma regla que cancelación)
  - Valida que `newDate > DateTime.UtcNow`
  - Actualiza `reservation.TourDate = newDate`
  - Llama `UpdateAsync`
- En `back/TuristGo.API/Controllers/ReservationController.cs` agregar:
  ```csharp
  [HttpPatch("{id:int}/reschedule")]
  [Authorize(Roles = "Tourist")]
  public async Task<ActionResult> Reschedule(int id, [FromBody] RescheduleRequestDTO dto)
  ```
- Crear `back/TuristGo.API/DTOs/Request/RescheduleRequestDTO.cs` → `record(string NewDate)`

**Frontend — `Front/src/app/pages/tourist/TouristReservationDetailPage.tsx`:**
- El botón "Cambiar fecha" ya existe en el JSX pero sin handler
- Agregar estado `showRescheduleModal` + `newDate`
- Crear modal sencillo con `<input type="date" min={hoy+1}>` y botón confirmar
- Handler llama `PATCH /reservation/{id}/reschedule` con `{ newDate }`
- Al éxito: recargar la reserva y mostrar toast

**Servicio frontend:** Agregar `rescheduleReservationApi(id, newDate)` en `Front/src/app/lib/api/services/reservationService.ts`

---

### Feature 3 — HU-47: Factura manual agencia

**Historia de usuario:** La agencia puede emitir una factura manual para una reserva, con monto y descripción del ajuste.

**Decisión:** Implementar endpoint en back + restaurar diálogo en `AgencyInvoicesPage`.

**Lo que hay que hacer:**

**Entidad:** Agregar campo `IsManual bool` y `ManualDescription string?` a `back/TuristGo.Domain/Entities/Invoice.cs`. Crear migración EF.

**Backend:**
- En `back/TuristGo.Domain/Interfaces/Repositories/IInvoiceRepository.cs` agregar:
  ```csharp
  Task<Invoice> CreateManualAsync(int agencyId, int reservationId, decimal amount, string description);
  ```
- Implementar en `back/TuristGo.DataAccess/Repositories/InvoiceRepository.cs`
- En `back/TuristGo.API/Controllers/InvoiceController.cs` agregar:
  ```csharp
  [HttpPost("agency/manual")]
  [Authorize(Roles = "Agency")]
  ```
  - Valida que la reserva pertenezca a un tour de la agencia
  - Crea `Invoice` con `IsManual = true`
- Crear `back/TuristGo.API/DTOs/Request/ManualInvoiceRequestDTO.cs` → `record(int ReservationId, decimal Amount, string Description)`

**Frontend — `Front/src/app/pages/agency/AgencyInvoicesPage.tsx`:**
- Restaurar botón "Emitir factura manual" y el diálogo que existía
- Conectar a `POST /invoice/agency/manual` mediante nueva función `createManualInvoiceApi` en `invoiceService.ts`
- Actualizar la columna "Tipo" en la tabla para mostrar "Manual" vs "Automática"

---

### Feature 4 — HU-52: Descarga de PDF real con `window.print()`

**Historia de usuario:** El turista puede descargar su factura como PDF.

**Decisión:** Usar `window.print()` con CSS `@media print`. Cero dependencias nuevas. El usuario elige "Guardar como PDF" en el diálogo de impresión del navegador.

**Lo que hay que hacer:**

**Frontend — `Front/src/app/pages/tourist/TouristInvoicesPage.tsx`:**
- El modal de vista previa ya existe con el HTML de la factura bien estructurado
- Agregar CSS de impresión en `Front/src/styles/index.css`:
  ```css
  @media print {
    body > *:not(#invoice-print-area) { display: none !important; }
    #invoice-print-area { display: block !important; }
  }
  ```
- Dar `id="invoice-print-area"` al `div` interno del modal
- Cambiar el botón "Descargar" para que ejecute:
  ```typescript
  const handlePrint = () => {
    window.print();
  };
  ```
- El modal debe seguir visible durante `window.print()`. Agregar clase `print:block` al modal overlay o manejarlo con el id.

---

### Feature 5 — Imágenes de tours (URL por categoría + URL editable)

**Historia de usuario:** Los tours muestran imágenes reales en las cards y páginas de detalle.

**Decisión:** Dos partes:
1. El backend devuelve una URL de imagen por defecto según la categoría del tour (Unsplash, URLs fijas)
2. Al crear un tour, la agencia puede pegar una URL de imagen personalizada

**Lo que hay que hacer:**

**Backend — `back/TuristGo.API/Mappings/MappingProfile.cs`:**
- Cambiar el mapeo de `ImagePlaceholder` para que en vez de `null` devuelva una URL por categoría:
  ```csharp
  .ForCtorParam("ImagePlaceholder", opt => opt.MapFrom(src => GetImageByCategory(src.Category)))
  ```
  con un método privado que mapee: Cultura → URL Unsplash cultura, Aventura → URL aventura, etc.

**Backend — `back/TuristGo.Domain/Entities/Tour.cs`:**
- Agregar `public string? ImageUrl { get; set; }` — la agencia puede guardar URL personalizada

**Backend — `back/TuristGo.API/DTOs/Request/CreateTourRequestDTO.cs`:**
- Agregar campo opcional `string? ImageUrl`

**Backend — `back/TuristGo.API/Controllers/TourController.cs`:**
- En `Create` y `Update`: asignar `tour.ImageUrl = dto.ImageUrl`
- En `MappingProfile`: si `tour.ImageUrl` no es null, usarlo; si es null, usar el default por categoría

**Frontend — `Front/src/app/pages/agency/AgencyCreateTourPage.tsx`:**
- Agregar campo opcional "URL de imagen" con placeholder "https://..."
- Incluirlo en el body del `POST /tour`

**Migración EF:** necesaria para el campo `ImageUrl` en `Tour`.

---

## Documento de decisiones técnicas a generar al final

Al finalizar la implementación, crear `DECISIONES_TECNICAS.md` en la raíz del proyecto con:

- Tabla de features implementados vs alternativas descartadas y por qué
- Sección de deuda técnica conocida (HU-15 sin SMTP real, PDF sin librería dedicada, etc.)
- Sección de cómo conectar SMTP en producción (variables de entorno, proveedor sugerido)
- Sección de cómo conectar almacenamiento de imágenes real (Azure Blob / S3)

---

## Instrucciones para Claude en la nueva sesión

1. Leer este archivo primero para tener contexto completo
2. Clonar o abrir el repo en `C:\repositories\TuristGo`
3. Verificar que `git log --oneline -3` muestre el commit `6190caf` como más reciente
4. Implementar los 5 features en el orden listado arriba (Feature 1 primero por ser el más complejo)
5. Después de cada feature: `dotnet build` en `back/` + `npm run build` en `Front/` — ambos deben pasar con 0 errores
6. Commit por feature con mensaje descriptivo
7. Al final de los 5 features: crear `DECISIONES_TECNICAS.md`
8. Push final a `https://github.com/PixelJhonix/TURISGO.git` rama `master`

**Reglas importantes:**
- No usar `MockData` ni `toursStorage` — esos archivos son legacy, el archivo `toursStorage.ts` ya fue eliminado
- No crear archivos de documentación adicionales salvo `DECISIONES_TECNICAS.md`
- Los DTOs van en `back/TuristGo.API/DTOs/Request/` o `Response/` según corresponda
- Los servicios frontend van en `Front/src/app/lib/api/services/`
- Cada migración EF se crea con: `dotnet ef migrations add NombreMigracion --project TuristGo.DataAccess --startup-project TuristGo.API` ejecutado desde `back/`
- El `.gitignore` de la raíz excluye `Front/.env` — no commitear credenciales

---

## Archivos clave de referencia rápida

| Propósito | Ruta |
|---|---|
| Plan maestro de fases | `MASTER_PLAN.md` |
| Diagrama de clases GoF | `TuristGo_Merge_Completo.puml` |
| Cadena de conexión BD | `back/TuristGo.API/appsettings.json` |
| Variable API URL front | `Front/.env` (crear desde `Front/.env.example`) |
| Registro de servicios DI | `back/TuristGo.API/Program.cs` |
| Entidad User (campos reset) | `back/TuristGo.Domain/Entities/User.cs` |
| Facade reservas | `back/TuristGo.Domain/Services/Facades/ReservationFacade.cs` |
| Repositorio facturas | `back/TuristGo.DataAccess/Repositories/InvoiceRepository.cs` |
| Servicio facturas front | `Front/src/app/lib/api/services/invoiceService.ts` |
| Servicio reservas front | `Front/src/app/lib/api/services/reservationService.ts` |
| Página detalle reserva | `Front/src/app/pages/tourist/TouristReservationDetailPage.tsx` |
| Página facturas agencia | `Front/src/app/pages/agency/AgencyInvoicesPage.tsx` |
| Página facturas turista | `Front/src/app/pages/tourist/TouristInvoicesPage.tsx` |
| Rutas del router | `Front/src/app/routes.tsx` |
| CSS global (agregar @media print) | `Front/src/styles/index.css` |
