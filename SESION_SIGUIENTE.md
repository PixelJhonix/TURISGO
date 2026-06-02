# Sesión siguiente — TuristGo: estado actual y pendientes

**Actualizado:** 2026-06-02  
**Repo:** https://github.com/PixelJhonix/TURISGO.git — rama `master`  
**Directorio local:** `C:\repositories\TuristGo`

---

## Cómo arrancar el proyecto

```powershell
# Terminal 1 — Backend
cd C:\repositories\TuristGo\back
dotnet run --project TuristGo.API
# → http://localhost:5142 · Swagger en http://localhost:5142/swagger

# Terminal 2 — Frontend
cd C:\repositories\TuristGo\Front
npm run dev
# → http://localhost:5173

# O con el script automático (abre ambos + navegador):
.\start-dev.ps1
```

**Credenciales principales:**

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@turistgo.com | Admin123! |
| Agencia | andes@turistgo.com | Agency123! |
| Turista | tourist@turistgo.com | Tourist123! |
| Guía | guide1.1@turistgo.com | Guide123! |

Ver tabla completa de escenarios de prueba en [`README.md`](README.md).

---

## Lo que YA está implementado (no tocar)

- **35 HUs auditadas** → 27 ✅ cumplen completamente (ver [`AUDITORIA_HU.md`](AUDITORIA_HU.md))
- Backend: N capas, JWT, BCrypt, EF Core, 5 patrones GoF completos
- Frontend: 28 pantallas conectadas a API real, 0 mocks
- Seeder: 17 tours, 9 guías, 4 turistas, 4 agencias, 13 reservas con todos los estados límite
- Bugs corregidos: auth persist en refresh, reserva con fecha pasada, imágenes por categoría, botón reservar en dashboard, `[Authorize]` en PATCH status, validación propiedad en DELETE unavailability

---

## Lo que falta implementar

Ver detalle completo de cada pendiente con archivos exactos y pseudocódigo en [`PENDIENTES.md`](PENDIENTES.md).

### Resumen rápido

| # | HU | Feature | Complejidad | Migración EF |
|---|---|---|---|---|
| 1 | HU-15 | Recuperar contraseña (token SHA-256) | Alta | No — campos ya existen en `User.cs` |
| 2 | HU-43 | Cambio de fecha de reserva | Media | No |
| 3 | HU-47 | Factura manual agencia | Media | **Sí** — `IsManual`, `ManualDescription` en `Invoice` |
| 4 | HU-52 | Descarga PDF con `window.print()` | Baja | No |
| 5 | HU-41 | Turistas inscritos en tour (vista guía) | Baja | No |

### Orden recomendado de implementación

1. **HU-52** (20 min) — solo frontend, riesgo cero
2. **HU-41** (30 min) — endpoint simple + modal en GuideToursPage
3. **HU-43** (45 min) — facade + controller + modal frontend
4. **HU-47** (60 min) — migración EF + endpoint + UI
5. **HU-15** (90 min) — la más compleja, todo nuevo

### Reglas importantes
- No usar `MockData` ni `toursStorage` — eliminados
- DTOs en `back/TuristGo.API/DTOs/Request/` o `Response/`
- Servicios frontend en `Front/src/app/lib/api/services/`
- Cada migración EF desde `back/`: `dotnet ef migrations add NombreMigracion --project TuristGo.DataAccess --startup-project TuristGo.API`
- Verificar con `dotnet build` + `npm run build` (0 errores) antes de cada commit

---

## Archivos clave de referencia

| Propósito | Ruta |
|---|---|
| Pendientes con pseudocódigo | `PENDIENTES.md` |
| Auditoría HU por HU | `AUDITORIA_HU.md` |
| Diagrama de clases GoF | `TuristGo_Merge_Completo.puml` |
| Cadena de conexión BD | `back/TuristGo.API/appsettings.json` |
| Registro de servicios DI | `back/TuristGo.API/Program.cs` |
| Entidad User (campos reset) | `back/TuristGo.Domain/Entities/User.cs` |
| Entidad Invoice | `back/TuristGo.Domain/Entities/Invoice.cs` |
| Facade reservas | `back/TuristGo.Domain/Services/Facades/ReservationFacade.cs` |
| Interface facade reservas | `back/TuristGo.Domain/Interfaces/Services/IReservationFacade.cs` |
| Controller reservas | `back/TuristGo.API/Controllers/ReservationController.cs` |
| Controller invoice | `back/TuristGo.API/Controllers/InvoiceController.cs` |
| Repositorio invoice | `back/TuristGo.DataAccess/Repositories/InvoiceRepository.cs` |
| Interface IInvoiceRepository | `back/TuristGo.Domain/Interfaces/Repositories/IInvoiceRepository.cs` |
| Controller guide | `back/TuristGo.API/Controllers/GuideController.cs` |
| Página detalle reserva | `Front/src/app/pages/tourist/TouristReservationDetailPage.tsx` |
| Página facturas turista | `Front/src/app/pages/tourist/TouristInvoicesPage.tsx` |
| Página facturas agencia | `Front/src/app/pages/agency/AgencyInvoicesPage.tsx` |
| Página tours guía | `Front/src/app/pages/guide/GuideToursPage.tsx` |
| Servicio reservas front | `Front/src/app/lib/api/services/reservationService.ts` |
| Servicio facturas front | `Front/src/app/lib/api/services/invoiceService.ts` |
| Rutas del router | `Front/src/app/routes.tsx` |
| CSS global (media print ya agregado) | `Front/src/styles/index.css` |
