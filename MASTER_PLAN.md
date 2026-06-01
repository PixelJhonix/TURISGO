# TuristGo — Plan Maestro Consolidado
## Auditoría completa + Plan de ejecución por fases aisladas

**Versión:** 1.0 — 2026-06-01  
**Consolida:** `FRONTEND_AUDIT_MATRIX.md` + `PLAN_CORRECCION_ENTREGABLE3.md`  
**Referencia:** `TuristGo_Merge_Completo.puml` · `ENTREGABLE 3 (Abierto).pdf`  
**Tipo de auditoría:** Estática (sin cambios de código)

---

## 0. Corrección arquitectural — N capas (no monolito)

> El documento `PLAN_CORRECCION_ENTREGABLE3.md` y algunos artefactos anteriores usaban
> el término "monolito". **La arquitectura real y correcta del proyecto es N capas.**

| Capa | Proyecto .NET | Responsabilidad |
|------|--------------|----------------|
| **Presentación** | `TuristGo.API` | Controllers REST, DTOs, AutoMapper, Middlewares, JWT config |
| **Dominio** | `TuristGo.Domain` | Entidades, Enums, Interfaces, Servicios + Patrones GoF |
| **Acceso a datos** | `TuristGo.DataAccess` | DbContext EF Core, Repositorios, Migrations, Seeders |
| **Cliente SPA** | `Front/` | React 18, React Router 7, Tailwind/shadcn, servicios API |

La separación física existe en el código (`TuristGo.slnx` con 3 proyectos). La deuda no está en la separación de proyectos sino en que **muchos servicios de dominio tienen lógica stub o incompleta**, y que el **frontend aún consume mockData** en lugar de los endpoints reales. Eso no es un problema de arquitectura (N capas está correcta), es un problema de implementación de reglas de negocio.

---

## 1. Resumen ejecutivo de estado actual

### 1.1 Backend (ASP.NET Core 10)

| Área | Estado global | Principal brecha |
|------|--------------|-----------------|
| Estructura de capas | ✅ Correcta | — |
| Patrones GoF (Factory, Strategy, Observer, Facade, Builder) | ⚠️ Esbozados | No cubren todas las RN del entregable |
| Auth / Registro | ⚠️ Parcial | Lockout 30 min (doc: 15), sin validación email único, guías sin endpoint |
| Tours | ⚠️ Parcial | Listar activos OK; crear/editar/asignar guía-vehículo son stubs |
| Reservas | ⚠️ Parcial | Crear real; cancelar no anula factura; sin cruce horario |
| Facturación | ⚠️ Parcial | Listado admin real; sin filtro por rol, sin PDF |
| Admin (usuarios/servicios) | ⚠️ Parcial | Aprobar OK; delete sin validaciones; motivo suspensión ignorado |
| Guía / Disponibilidad | ❌ Stub | `GET /agency/guides` vacío; cert y no-disponibilidad sin lógica |
| Reportes | ⚠️ Parcial | Ingresos por agencia real; sin período/completadas/anuladas |

### 1.2 Frontend (React 18)

| Métrica | Valor |
|---------|-------|
| Pantallas auditadas | 28 |
| Pantallas con al menos 1 llamada real al backend | 7 |
| Pantallas mock/local-only dominantes | 21 |
| Rutas rotas confirmadas | 1 (`/admin/configuracion`) |
| Acciones `missing` (sin handler ni API) | ~24 |
| Acciones `mock` (datos hardcodeados / localStorage) | ~20 |

### 1.3 Patrones GoF vs diagrama `TuristGo_Merge_Completo.puml`

| Patrón | En diagrama | En código | Brecha |
|--------|------------|-----------|--------|
| **Factory Method** | `IUsuarioFactory` → Turista/Agencia/GuiaFactory | Existe | `AgencyController.CreateGuide` no invoca `GuideFactory` |
| **Strategy** | `IAuthStrategy` → 4 estrategias | Existe | Lockout incorrecto en `AuthService`; orden de validaciones |
| **Observer** | `IReservaObserver` → 5 observers (incl. `CalificacionObserver`) | 4 implementados | `CalificacionObserver` no wired; `FacturaObserver` no anula en `Cancelled` |
| **Facade** | `ReservaFacade` con `DisponibilidadService`, `CupoService`, etc. | Parcial | `DisponibilidadService.TieneCruceHorario` no implementado |
| **Builder** | `IReporteFacturacionBuilder` → 3 builders + director | Parcial | Director no usa filtro fecha; report admin sin reservas completadas |

---

## 2. Validación completa por Historia de Usuario (Entregable 3)

### Leyenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Cumple back y front |
| ⚠️ | Parcial |
| ❌ | No implementado |

### ÉPICA 1 — Gestión de usuarios

| HU | Descripción | Back | Front | Brecha principal |
|----|------------|------|-------|-----------------|
| HU-01 | Registro turista | ⚠️ | ✅ | Sin validación email único ni reglas contraseña en back |
| HU-02 | Registro agencia | ⚠️ | ⚠️ | NIT sin formato, sin upload doc, password hardcodeada en front |
| HU-04 | Registro guía por agencia | ❌ | ❌ | Endpoint devuelve `Ok()` vacío; `GuideFactory` existe pero no se invoca |
| HU-05 | Login turista | ⚠️ | ✅ | Lockout 30 min (debe ser 15); orden validación incorrecto |
| HU-06 | Login agencia | ✅ | ✅ | Textos exactos del PDF por alinear |
| HU-07 | Login guía | ⚠️ | ⚠️ | `AlertMessage` en strategy ✅; `GET /guide/tours` devuelve vacío |
| HU-09 | Consulta usuarios (admin) | ⚠️ | ⚠️ | Listar/aprobar ✅; DELETE sin reglas TOURIST-01/AGENCY-03 |
| HU-10 | Consulta guías (agencia) | ❌ | ❌ | Array vacío en API; front usa mock |
| HU-11 | Actualización perfil turista | ❌ | ❌ | Stub `NoContent` en controller |
| HU-12 | Actualizar certificado guía | ❌ | ❌ | Stub; sin `CertificateHistory` |
| HU-13 | Suspender/eliminar (admin) | ⚠️ | ⚠️ | Suspensión ✅; motivo ignorado en back; delete sin endpoint |
| HU-14 | Eliminar cuenta turista | ❌ | ❌ | Stub; sin validación reservas activas ni contraseña |
| HU-15 | Recuperación contraseña | ❌ | ⚠️ | Sin endpoint, sin SMTP; front tiene placeholder |

### ÉPICA 2 — Gestión de servicios

| HU | Descripción | Back | Front | Brecha principal |
|----|------------|------|-------|-----------------|
| HU-17 | Creación de tour | ⚠️ | ❌ | Persiste crudo; sin código único, estado inicial, ni TourService |
| HU-19 | Asignación guía a tour | ❌ | ❌ | Stub `NoContent`; GUIDE-01/02/03/04 sin aplicar |
| HU-21 | Exploración catálogo | ⚠️ | ⚠️ | Devuelve todos los estados (no solo activos); filtro solo client-side |
| HU-22 | Tours asignados (guía) | ❌ | ❌ | Endpoint vacío; front mock |
| HU-23 | Edición tour | ❌ | ❌ | PUT sin reglas retroactivas de cupos/precio |
| HU-24 | No disponibilidad guía | ❌ | ❌ | Stub; sin validaciones GUIDE-02/RN-14 |
| HU-25 | Desactivación temporal (agencia) | ⚠️ | ❌ | PATCH status existe; sin chequeo reservas futuras |
| HU-26 | Baja servicio (admin) | ⚠️ | ⚠️ | Inactiva tour ✅; motivo no persistido; notificación ausente |
| HU-28B | Asignación vehículo a tour | ❌ | ❌ | Stub; VEHICLE-01/02 sin aplicar |
| HU-55 | Calificación tour | ❌ | ❌ | Stub; sin índice único reserva; sin recálculo rating |

### ÉPICA 3 — Gestión de transporte

| HU | Descripción | Back | Front | Brecha principal |
|----|------------|------|-------|-----------------|
| HU-27 | Registro vehículo | ⚠️ | ❌ | CRUD básico; sin validar placa única/formato |
| HU-29/30 | Vehículo visible turista/guía | ❌ | ❌ | No incluido en DTOs respuesta |
| HU-32 | Estado vehículo | ❌ | ❌ | Stub; VEHICLE-03 sin aplicar |
| HU-34 | Eliminar vehículo | ⚠️ | ❌ | DELETE genérico existe; sin validar tours futuros |

### ÉPICA 4 — Gestión de reservas

| HU | Descripción | Back | Front | Brecha principal |
|----|------------|------|-------|-----------------|
| HU-35 | Realizar reserva | ⚠️ | ✅ | Facade crea + descuenta cupo ✅; sin número único legible; sin cruce horario |
| HU-38 | Alerta cruce horarios | ❌ | ❌ | `DisponibilidadService.TieneCruceHorario` no implementado |
| HU-39 | Historial reservas turista | ❌ | ❌ | Sin `GET /tourist/reservations`; front mock |
| HU-40 | Reservas agencia | ❌ | ❌ | Sin endpoint; front mock |
| HU-41 | Turistas en tour (guía) | ❌ | ❌ | No expuesto |
| HU-42 | Marcar completada | ❌ | ❌ | Sin `PATCH reservations/{id}/complete`; RES-06 sin aplicar |
| HU-43 | Cambio fecha reserva | ❌ | ❌ | No implementado |
| HU-44 | Cancelación reserva | ⚠️ | ❌ | Cambia estado ✅; factura no pasa a `Voided`; sin validar 24h |

### ÉPICA 5 — Gestión de facturas

| HU | Descripción | Back | Front | Brecha principal |
|----|------------|------|-------|-----------------|
| HU-47 | Factura manual agencia | ❌ | ❌ | Sin endpoint ni flag `Manual` |
| HU-48 | Facturas turista | ❌ | ❌ | GET genérico sin filtro por rol; front mock |
| HU-49 | Histórico agencia | ❌ | ❌ | Sin filtro por agencia/fechas |
| HU-50 | Reporte global admin | ⚠️ | ⚠️ | Ingresos por agencia ✅; faltan completadas, período, anuladas separadas |
| HU-52 | PDF factura | ❌ | ❌ | Sin generación |

---

## 3. Reglas de negocio transversales — estado global

| RN | Tema | Estado | Nota |
|----|------|--------|------|
| RN-01–04 | Guías solo por agencia aprobada | ⚠️ | Factory OK; API guía no funciona |
| RN-05–06 | Cruce horarios guía/turista | ❌ | `DisponibilidadService` no implementado |
| RN-07 | Cupos | ⚠️ | `CapacityObserver` sí; sin validación doble en cancel 24h |
| RN-08 | Cancelar >24h | ❌ | — |
| RN-09–10 | Reviews / completar | ❌ | — |
| RN-11–12 | Vehículos | ❌ | — |
| RN-13–14 | Certificado / disponibilidad guía | ❌ | — |
| RN-15–16 | Eliminar cuenta con reglas | ❌ | — |
| RN-17 | Suspender agencia → tours inactivos | ✅ | `TourStatusObserver` funciona |
| RN-18 | Factura confirmada/anulada al cancelar | ❌ | Solo creación; no anulación |
| RN-19 | Precio tour | ❌ | Sin validación TOUR-02 |
| RN-20 | RBAC | ⚠️ | Roles en JWT OK; muchos endpoints sin `[Authorize]` fino |
| RN-21 | Comisión por agencia | ⚠️ | `InvoiceObserver` si Agency cargada; faltan reportes retención Builder |

---

## 4. Auditoría de pantallas frontend — matriz de conectividad

### Pantallas conectadas a backend real (7/28)

| Pantalla | Ruta | Endpoint real |
|---------|------|--------------|
| `LoginPage` | `/login` | POST `/auth/login`, GET `/auth/me` |
| `RegisterTouristPage` | `/registro/turista` | POST `/auth/register/tourist` |
| `RegisterAgencyPage` | `/registro/agencia` | POST `/auth/register/agency` |
| `ToursPublicPage` | `/tours` | GET `/tour` |
| `TourDetailPage` | `/tours/:id` | GET `/tour` + POST `/reservation` |
| `TouristToursPage` | `/turista/tours` | Hereda GET `/tour` |
| `Navbar/Sidebar logout` | global | — (client-only) |

### Pantallas mock/local dominantes (21/28)

| Rol | Pantallas mock | Causa |
|-----|--------------|-------|
| Turista | Dashboard, Reservas, Detalle reserva, Facturas, Perfil | `mockReservations`, `mockInvoices`, `mockTours`; sin endpoints `/tourist/*` |
| Agencia | Dashboard, Tours, Crear tour, Asignar vehículo, Guías, Flota, Reservas, Facturas | `toursStorage`, `mockGuides`, `mockVehicles`; endpoints stub |
| Guía | Dashboard, Tours, Disponibilidad | `mockTours`, `mockUsers`; endpoints vacíos |
| Admin | Dashboard, Usuarios (parcial), Servicios, Reportes | Operaciones críticas sin persistencia real |

### Problemas bloqueantes (P0)

| # | Problema | Impacto |
|---|---------|---------|
| 1 | Admin/agencia ops son mutaciones locales sin persistencia | Estado se pierde al refrescar |
| 2 | Ciclo reserva incompleto: crear real, resto mock | Divergencia de datos |
| 3 | `tourService` mapea `images: []`; UI consume `tour.images[0]` | Imágenes rotas en cards y detalle |

### Problemas altos (P1)

| # | Problema | Impacto |
|---|---------|---------|
| 4 | Forgot/reset/perfil/cuenta sin backend | Flujos de seguridad simulados |
| 5 | Guide dashboard con botones sin handler | UX rota |
| 6 | `/admin/configuracion` no declarado en `routes.tsx` | Link en Sidebar redirige a `/` |

### Problemas medios (P2)

| # | Problema | Impacto |
|---|---------|---------|
| 7 | Datos híbridos: tours de API + chequeos sobre mockData | Comportamiento inconsistente |
| 8 | Password hardcodeada en `RegisterAgencyPage` (`'Agency123!'`) | Mismatch con políticas reales |

---

## 5. Plan de ejecución por fases aisladas

> **Principio de aislamiento:** cada fase entrega valor completo y no depende de la siguiente.  
> Los cambios de una fase posterior **nunca deben romper** lo entregado en una fase anterior.  
> El orden es de menor a mayor dependencia.

---

### FASE 0 — Base estructural (ya ejecutada ✅)

**Estado:** Completada. Separación de archivos 1 clase/interfaz por archivo aplicada.

**Qué NO rompe fases posteriores:** La separación de archivos es prerequisito de todas las fases; ya está hecho y es estable.

| Tarea | Estado |
|-------|--------|
| 9 controllers separados en `TuristGo.API/Controllers/` | ✅ |
| 11 DTOs en `Request/` y `Response/` | ✅ |
| 13 entidades en `TuristGo.Domain/Entities/` | ✅ |
| 6 enums en `TuristGo.Domain/Enums/` | ✅ |
| 22 servicios con patrones en subdirectorios | ✅ |
| 5 repositorios en `TuristGo.DataAccess/Repositories/` | ✅ |
| `dotnet build` → 0 errores | ✅ |

---

### FASE A — Fundamentos de autenticación y contratos de datos

**Alcance:** Correcciones de auth que afectan todo lo demás. Sin estas, fases B-E producen comportamiento incorrecto.  
**No afecta:** ninguna fase anterior (Fase 0 es solo estructura).  
**Habilita:** Fases B, C, D, E pueden construir sobre auth correcta y DTOs estables.

#### A.1 — Corrección `AuthService` (HU-05)

Archivo: `back/TuristGo.Domain/Services/AuthService.cs`

| Corrección | Regla violada |
|-----------|--------------|
| Comprobar `LockoutUntil` **antes** de validar contraseña | HU-05 CA-03 |
| Cambiar timeout de 30 → 15 minutos | HU-05 CA-03 |
| Eliminar código muerto (reset lockout antes de evaluar) | HU-05 CA-03 |

#### A.2 — Validación email único (HU-01, HU-02)

Archivos: `back/TuristGo.Domain/Services/` (factories y/o `AuthService`)

| Corrección | Regla violada |
|-----------|--------------|
| Verificar email único antes de `CreateAsync` en `TuristaFactory` | HU-01 CA-02 |
| Verificar email único en `AgencyFactory` | HU-02 CA-03 |
| Respuesta 409 Conflict con mensaje alineado al CA | HU-01/02 |

#### A.3 — Validación contraseña en back (HU-01)

Archivo: `back/TuristGo.Domain/Services/Factories/TuristaFactory.cs`

| Corrección | Regla violada |
|-----------|--------------|
| Reglas de complejidad (mayúscula, número, mínimo 8 chars) | HU-01 CA-03 |
| Respuesta 400 con mensaje descriptivo | HU-01 CA-03 |

#### A.4 — Validación NIT formato (HU-02)

Archivo: `back/TuristGo.Domain/Services/Factories/AgencyFactory.cs`

| Corrección | Regla violada |
|-----------|--------------|
| Validar formato `900123456-7` | HU-02 CA-02 |

#### A.5 — ExceptionMiddleware + respuestas estándar

Archivo: `back/TuristGo.API/Middlewares/ExceptionMiddleware.cs`

| Corrección | Efecto |
|-----------|--------|
| Mapear excepciones a 400/409/404/500 con body `{error, detail}` | Mensajes CA en todos los HU |

#### A.6 — DTOs de respuesta completos (contratos estables)

Archivos: `back/TuristGo.API/DTOs/Response/`

| DTO a completar | Campos faltantes | Usado por |
|----------------|-----------------|-----------|
| `TourResponseDTO` | `images`, `averageRating`, `guideId`, `vehicleId` | HU-21, front `TourCard` |
| `ReservationResponseDTO` | `numeroReserva` (legible), `vehicleInfo`, `tourName` | HU-35, HU-39 |
| `InvoiceResponseDTO` | `tourName`, `agencyName`, `isManual` | HU-48, HU-49 |

#### A.7 — Corregir `RegisterAgencyPage` password hardcodeada (front)

Archivo: `Front/src/app/pages/RegisterAgencyPage.tsx`

| Corrección | Problema |
|-----------|---------|
| Agregar campo `password` al formulario de agencia | Password `'Agency123!'` hardcodeada |

#### A.8 — Resolver ruta `/admin/configuracion` (front)

Archivo: `Front/src/app/routes.tsx`

| Corrección | Problema |
|-----------|---------|
| Agregar ruta con `AdminSettingsPage` o quitar link del Sidebar | Link redirige silenciosamente a `/` |

---

### FASE B — Flujo crítico MVP (tours + reservas + admin core)

**Prerequisito:** Fase A completada (auth correcta + DTOs estables).  
**No afecta:** Fase A es auth; estos son dominios distintos.  
**Habilita:** Fase C (guías/agencia dependen de tours), Fase D (facturas dependen de reservas).

#### B.1 — TourService: crear/listar/editar (HU-17, 21, 23)

Archivos: `back/TuristGo.Domain/Services/` (nuevo `TourService.cs`) + `back/TuristGo.API/Controllers/TourController.cs`

| Método | Regla |
|--------|-------|
| `CreateAsync(dto, agencyId)` | Genera `CodigoUnico`; estado inicial `Inactive`; TOUR-02 precio |
| `GetActiveAsync(filters)` | Solo `Status == Active`; query params `?category=&city=` |
| `UpdateAsync(id, dto)` | Sin reducir cupos bajo reservas existentes |
| `DeactivateAsync(id)` | Validar sin reservas `Confirmed` futuras (HU-25) |

**Front:** `AgencyCreateTourPage` → conectar a `POST /tour`; `AgencyToursPage` → `PUT /tour/{id}`, `PATCH /tour/{id}/deactivate`.

#### B.2 — DisponibilidadService: cruce horario (HU-35, 38)

Archivo: `back/TuristGo.Domain/Services/Facades/ReservaFacade.cs` + nuevo `DisponibilidadService.cs`

| Método | Regla |
|--------|-------|
| `TieneCruceHorario(turistaId, tourId)` | RES-02 / RN-06: overlapping `FechaHoraInicio`-`FechaHoraFin` |
| Mensaje 409 con `{ tourConflicto, horario }` | HU-38 CA-01 |

**Front:** `TourDetailPage` reemplazar `checkScheduleConflict` con mock → llamada real al endpoint que usa la facade.

#### B.3 — Ciclo completo de reserva (HU-39, 40, 42, 44)

Archivos: `back/TuristGo.API/Controllers/ReservationController.cs` + servicios

| Endpoint nuevo | Regla |
|--------------|-------|
| `GET /tourist/reservations` | HU-39: por `TouristId` del JWT + filtros |
| `GET /agency/reservations` | HU-40: por `AgencyId` del JWT |
| `PATCH /reservation/{id}/complete` | HU-42: validar tour fecha pasada (RES-06) |
| Extender cancel: `InvoiceObserver` → `Voided` | HU-44: RN-18 |
| Validar 24h en cancel | HU-44: RN-08 |

**Front:**
- `TouristReservationsPage`: `mockReservations` → `GET /tourist/reservations`
- `TouristReservationDetailPage`: mock → datos reales
- `AgencyReservationsPage`: mock → `GET /agency/reservations`; `handleMarkAsCompleted` → `PATCH /reservation/{id}/complete`
- `TouristReservationsPage`: `handleCancelReservation` → `PATCH /reservation/{id}/cancel`

#### B.4 — Admin: delete con validaciones + motivo suspensión (HU-09, 13)

Archivos: `back/TuristGo.API/Controllers/AdminController.cs` + `back/TuristGo.Domain/Services/AdminService.cs`

| Corrección | Regla |
|-----------|-------|
| `DELETE /admin/users/{id}` con validación reservas activas | HU-09 CA-03, RN-15/16 |
| Body obligatorio `Reason` en `PATCH /admin/users/{id}/suspend` | HU-13 CA-01 |
| Auditoría mínima (log o campo en `User`) | HU-13 |

**Front:**
- `AdminUsersPage`: botón eliminar → `DELETE /admin/users/{id}` con confirmación
- `AdminUsersPage`: `handleSuspend` → incluir motivo en payload

#### B.5 — Tour images contract (P0 blocker)

Archivos: `back/TuristGo.API/DTOs/Response/TourResponseDTO.cs` + `Front/src/app/lib/api/mappers.ts`

| Corrección | Problema |
|-----------|---------|
| Incluir campo `images` en `TourResponseDTO` (o URL placeholder) | `tour.images[0]` → broken en cards/detail |
| `mappers.ts` mapear `images` correctamente | Front consume array vacío |

---

### FASE C — Dominio agencia y guía

**Prerequisito:** Fase B (tours creados, reservas funcionales).  
**No afecta:** Fases A y B son independientes de este dominio.  
**Habilita:** Fase D (facturas agencia dependen de guías/tours asignados).

#### C.1 — GuideFactory activada + endpoint guías (HU-04, 10)

Archivos: `back/TuristGo.API/Controllers/AgencyController.cs` + `back/TuristGo.Domain/Services/AgencyService.cs`

| Corrección | Regla |
|-----------|-------|
| `AgencyService.RegisterGuide` invoca `GuideFactory` (no `Ok()` vacío) | HU-04 CA-01 |
| `GET /agency/guides` filtra por `AgencyId` del JWT | HU-10 CA-01 |
| DTO guía incluye `diasParaVencimiento` + `toursActivos` | HU-10 CA-02 |
| Verificar `IUserRepository.ExistsGuideCertificateAsync` en creación | HU-04 CA-02 |

**Front:** `AgencyGuidesPage` → `GET /agency/guides` y `POST /agency/guides`.

#### C.2 — Asignación guía a tour con validaciones (HU-19)

Archivos: `back/TuristGo.Domain/Services/TourService.cs` (extiende B.1)

| Método | Regla |
|--------|-------|
| `AssignGuideAsync(tourId, guideId)` | GUIDE-01: cert vigente; GUIDE-02: disponibilidad; GUIDE-03: <24h; GUIDE-04: cruce horarios |
| Activar tour tras asignación exitosa | HU-19 CA-01 → `PuedeActivarse()` |

**Front:** `AgencyToursPage` `handleAssignGuide` → `POST /tour/{id}/guides`.

#### C.3 — Asignación vehículo a tour (HU-28B)

Archivos: `back/TuristGo.Domain/Services/VehiculoService.cs` (ya en diagrama PUML)

| Método | Regla |
|--------|-------|
| `AssignATour(vehiculoId, tourId)` | VEHICLE-01: disponible; VEHICLE-02: capacidad >= cupos tour |

**Front:** `AgencyAssignVehiclePage` → `POST /tour/{id}/vehicle`.

#### C.4 — CRUD vehículos con validaciones (HU-27, 32, 34)

Archivos: `back/TuristGo.API/Controllers/VehicleController.cs` + `VehiculoService.cs`

| Corrección | Regla |
|-----------|-------|
| Validar placa única + formato en `RegisterVehicle` | HU-27 CA-02/03 |
| `ChangeStatusAsync` con VEHICLE-03 | HU-32 |
| `DeleteVehicle` con validación tours futuros | HU-34 CA-02 |

**Front:** `AgencyFleetPage` → todos los handlers a endpoints reales.

#### C.5 — Guía: tours asignados + no disponibilidad (HU-22, 24, 07)

Archivos: `back/TuristGo.API/Controllers/GuideController.cs` + nuevo `GuideService.cs`

| Endpoint | Regla |
|---------|-------|
| `GET /guide/tours` filtra por `GuideId` del JWT | HU-22 CA-01 |
| `POST /guide/unavailability` | HU-24 CA-01: fecha no pasada |
| Validar conflicto con tours asignados | HU-24 CA-03 |
| Front: alerta certificado post-login | HU-07 CA-02 |

**Front:**
- `GuideToursPage` → `GET /guide/tours`
- `GuideAvailabilityPage` → POST/DELETE reales
- `GuideDashboard` → handlers de botones rápidos

#### C.6 — Actualizar perfil turista + delete cuenta (HU-11, 14)

Archivos: `back/TuristGo.API/Controllers/TouristController.cs` + `TouristService.cs`

| Endpoint | Regla |
|---------|-------|
| `PUT /tourist/profile` | HU-11 CA-01; correo no editable (CA-02) |
| `DELETE /tourist/account` con `{password}` | HU-14 CA-03; validar reservas activas CA-02 (TOURIST-01/02) |

**Front:** `TouristProfilePage` → todos los handlers.

#### C.7 — Actualizar certificado guía con historial (HU-12)

Archivos: `back/TuristGo.Domain/Services/AgencyService.cs`

| Método | Regla |
|--------|-------|
| `UpdateCertificateAsync` archivando en `CertificateHistory` | HU-12 CA-01/02; CERT-01/02/03 |

**Front:** `AgencyGuidesPage` `handleUpdateCertificate` → `PUT /guides/{id}/certificate`.

---

### FASE D — Facturación y reportes

**Prerequisito:** Fase B (reservas completas con estados correctos).  
**No afecta:** Fases A, B, C son independientes de este módulo de reporting.  
**Entrega:** Cierra todas las épicas del Entregable 3.

#### D.1 — Facturas por rol (HU-48, 49)

Archivos: `back/TuristGo.API/Controllers/InvoiceController.cs` + `InvoiceService.cs`

| Endpoint | Regla |
|---------|-------|
| `GET /tourist/invoices` por `TouristId` del JWT | HU-48 CA-01 |
| `GET /agency/invoices?start=&end=` por `AgencyId` | HU-49 CA-01/03 |
| DTO incluye `tourName`, `agencyName`, `estado` | HU-48/49 |

**Front:**
- `TouristInvoicesPage` → `GET /tourist/invoices`
- `AgencyInvoicesPage` → `GET /agency/invoices`

#### D.2 — Reporte admin completo (HU-50)

Archivos: `back/TuristGo.API/Controllers/AdminController.cs` + Builder pattern (ya en PUML)

| Endpoint | Regla |
|---------|-------|
| `GET /admin/reports/billing?start=&end=` | HU-50 CA-01: período, completadas, emitidas/anuladas separadas |
| `ReporteDirector` con filtro fecha | RN-21 retención por agencia |

**Front:** `AdminReportsPage` → datos reales del endpoint; reemplazar `mockInvoices/Reservations`.

#### D.3 — Calificación tour (HU-55)

Archivos: `back/TuristGo.API/Controllers/ReservationController.cs` + `ReviewService.cs`

| Endpoint | Regla |
|---------|-------|
| `POST /reservation/{id}/review` | HU-55 CA-01/02/03: índice único `ReservationId`; solo `Completed` |
| Recálculo `Tour.CalificacionProm` | HU-55; `CalificacionObserver` del diagrama PUML |

**Front:** `TouristReservationsPage` `handleRateTour` → `POST /reservation/{id}/review`.

#### D.4 — Factura manual agencia (HU-47, opcional)

Archivos: `back/TuristGo.API/Controllers/InvoiceController.cs`

| Endpoint | Regla |
|---------|-------|
| `POST /agency/invoices/manual` con flag `IsManual` | HU-47 CA-01/02 |

#### D.5 — PDF factura (HU-52, prioridad baja)

Archivos: nuevo `PdfService.cs` + librería QuestPDF o iText

| Endpoint | Regla |
|---------|-------|
| `GET /invoice/{id}/pdf` → `byte[]` | HU-52 CA-01/02 |

**Front:** `TouristInvoicesPage` / `AgencyInvoicesPage` `handleDownloadPdf` → endpoint real.

#### D.6 — HU-15 Recuperación contraseña (stub aceptable)

Archivos: nuevo `AuthController` + `PasswordResetService.cs`

| Endpoint | Regla | Prioridad |
|---------|-------|---------|
| `POST /auth/forgot-password` | HU-15 CA-04: correo no registrado | Alta |
| `POST /auth/reset-password` con token hash 30 min single-use | HU-15 CA-02/03/05 | Alta |
| Integración SMTP (Brevo o stub log) | HU-15 CA-01 | Media |

**Front:** `ForgotPasswordPage` → endpoints reales.

---

### FASE E — Frontend "cero mocks" (paralela a B–D)

**Prerequisito:** Cada tarea de Fase E requiere que el endpoint correspondiente de B/C/D esté completo.  
**Principio:** no avanzar frontend de un módulo hasta que el backend de ese módulo esté en Fase B/C/D.  
**No afecta:** El frontend es cliente; sus cambios no modifican lógica de dominio ni capas inferiores.

| Track | Pantallas | Depende de |
|-------|----------|-----------|
| **E-A: Auth + catálogo** | `ForgotPasswordPage`, `TouristProfilePage`, `TourDetailPage` (imagen), `ToursPublicPage` filtros | Fase A.5, A.6, A.7 |
| **E-B: Reservas turista** | `TouristDashboard`, `TouristReservationsPage`, `TouristReservationDetailPage` | Fase B.3 |
| **E-C: Admin** | `AdminUsersPage`, `AdminServicesPage`, `AdminDashboard`, `AdminReportsPage` | Fases B.4, D.2 |
| **E-D: Agencia** | `AgencyDashboard`, `AgencyToursPage`, `AgencyCreateTourPage`, `AgencyAssignVehiclePage`, `AgencyGuidesPage`, `AgencyFleetPage`, `AgencyReservationsPage`, `AgencyInvoicesPage` | Fases B.1, C.1–C.4, D.1 |
| **E-E: Guía** | `GuideDashboard`, `GuideToursPage`, `GuideAvailabilityPage` | Fase C.5 |

#### Regla transversal para todos los tracks E

Para cada pantalla, el criterio de "migrada" es:
1. Eliminar import de `mockData`, `mockReservations`, `mockTours`, `mockVehicles`, `mockUsers` o `mockInvoices`.
2. Eliminar import de `toursStorage`.
3. Conectar `useEffect` de carga a `service.getXxx()`.
4. Conectar handlers de mutación a `service.postXxx()` / `service.patchXxx()` / `service.deleteXxx()`.
5. Agregar estados `isLoading` y `error` visibles en UI.

---

## 6. Matriz de dependencias entre fases

```
Fase 0 (estructura)
    │
    ├── Fase A (auth + contratos)
    │       │
    │       ├── Fase B (MVP: tours, reservas, admin)
    │       │       │
    │       │       ├── Fase C (agencia + guía)
    │       │       │       │
    │       │       │       └── Fase D (facturas + reportes)
    │       │       │
    │       │       └── Fase E-B, E-C ──────────────────┐
    │       │                                            │
    │       └── Fase E-A                                 │
    │                                                    │
    └── ────────────────── Fase E-D, E-E ───────────────┘
```

**Regla de aislamiento:** si una fase posterior introduce un bug, el rollback cubre solo esa fase. Las anteriores permanecen estables porque:
- Cada fase trabaja sobre **servicios/endpoints distintos** o sobre **extensión** (agregar parámetros opcionales, no cambiar contratos existentes).
- Los DTOs se amplían con campos opcionales (retrocompatibles), nunca se renombran ni eliminan campos ya usados.
- Los nuevos endpoints se agregan a controllers existentes; los existentes no se modifican en firma.

---

## 7. Criterio de "hecho" por fase

| Fase | Criterio |
|------|---------|
| A | `dotnet build` → 0 errores; tests unitarios lockout 15 min pasan; Postman: 409 en email duplicado |
| B | Postman: flujo turista completo (crear reserva → cancelar → factura `Voided`); admin delete retorna 409 con reservas activas |
| C | Postman: crear guía → asignar a tour → tour se activa; `GET /agency/guides` retorna lista real |
| D | Postman: `GET /admin/reports/billing?start=2026-01-01&end=2026-12-31` retorna agregaciones; PDF descargable (si D.5) |
| E | Ninguna pantalla importa `mockData`; audit de red en DevTools muestra llamadas reales en todas las acciones |

---

## 8. Patrones GoF — checklist de completitud vs diagrama PUML

| Patrón | Clase PUML | Estado actual | Pendiente |
|--------|-----------|--------------|---------|
| Factory | `TuristaFactory` | ✅ | — |
| Factory | `AgenciaFactory` | ⚠️ | NIT format, email único |
| Factory | `GuiaFactory` | ⚠️ | Existe pero no invocada desde `AgencyService` |
| Strategy | `TuristaAuthStrategy` | ✅ | — |
| Strategy | `AgenciaAuthStrategy` | ✅ | — |
| Strategy | `GuiaAuthStrategy` | ⚠️ | `AlertMessage` no mostrado en front |
| Strategy | `AdminAuthStrategy` | ✅ | — |
| Strategy | `AuthService` (contexto) | ⚠️ | Orden lockout, 15 min |
| Observer | `FacturaObserver` | ⚠️ | No anula factura en `Cancelled` |
| Observer | `NotificacionObserver` | ⚠️ | Stub (email no enviado) |
| Observer | `CupoObserver` | ✅ | — |
| Observer | `TourObserver` (RN-17) | ✅ | — |
| Observer | `CalificacionObserver` | ❌ | Existe en PUML; no wired en `ReservaService` |
| Facade | `ReservaFacade` | ⚠️ | `DisponibilidadService.TieneCruceHorario` no impl. |
| Facade | `DisponibilidadService` | ❌ | Método cruce horario vacío |
| Facade | `TourQueryService` | ⚠️ | Lista todos los estados; sin query params |
| Facade | `VehiculoService` | ⚠️ | CRUD básico; sin `AssignATour` con validaciones |
| Builder | `ReporteTuristaBuilder` | ⚠️ | Sin filtro fecha |
| Builder | `ReporteAgenciaBuilder` | ⚠️ | Sin filtro fecha |
| Builder | `ReporteAdminBuilder` | ⚠️ | Sin completadas/anuladas separadas |
| Builder | `ReporteDirector` | ⚠️ | No pasa `desde/hasta` a builders |

---

## 9. Archivos de origen de este plan

Este documento consolida y reemplaza funcionalmente:

| Archivo anterior | Contenido migrado aquí |
|-----------------|----------------------|
| `FRONTEND_AUDIT_MATRIX.md` | Secciones 1.2, 4, y los tracks E de la Fase E |
| `PLAN_CORRECCION_ENTREGABLE3.md` | Secciones 0, 1.1, 2, 3, y las Fases A–D |

Los archivos originales se conservan como referencia histórica. Este `MASTER_PLAN.md` es el documento vivo.

---

*Auditoría estática — sin cambios de código. Generado 2026-06-01.*
