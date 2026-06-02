# Auditoría de Historias de Usuario — Entregable 3
**Última actualización:** 2026-06-02  
**Referencia:** `ENTREGABLE 3 (Abierto).pdf` · `TuristGo_Merge_Completo.puml`  
**Metodología:** revisión manual de código (controllers, servicios, DTOs, páginas frontend, servicios API)

> **Estado al cierre de sesión 2026-06-02:** 27 HUs ✅ · 2 ⚠️ · 5 ❌ pendientes.  
> Ver detalle de pendientes en [`PENDIENTES.md`](PENDIENTES.md).

---

## Leyenda

| Símbolo | Significado |
|---|---|
| ✅ | Implementado y cumple los CAs verificados |
| ⚠️ | Parcialmente implementado — falta al menos un CA |
| ❌ | No implementado o el código presente no cubre los CAs |

---

## ÉPICA 1 — Gestión de usuarios

---

### HU-01 — Registro de turista

**Criterios de aceptación verificados:**
- CA-01 El turista puede registrarse con email, contraseña, nombre y teléfono opcional
- CA-02 El sistema rechaza email ya registrado
- CA-03 La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `AuthController.RegisterTourist` → `TouristFactory.Create` valida contraseña; `userRepository.GetByEmailAsync` verifica duplicado antes de crear |
| Frontend | ✅ | `RegisterTouristPage.tsx` valida contraseña con regex y llama `registerTouristApi` |

**Cumple:** ✅

---

### HU-02 — Registro de agencia

**Criterios de aceptación verificados:**
- CA-01 La agencia puede registrarse con nombre comercial, NIT, email y contraseña
- CA-02 El NIT debe tener formato válido (9 dígitos, guion, 1 dígito)
- CA-03 El email debe ser único en el sistema
- CA-04 El estado inicial es `Pendiente` hasta aprobación del admin

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `AgencyFactory.Create` valida NIT con regex `^\d{9}-\d$`; verifica email único; crea con `Status = Pending` |
| Frontend | ✅ | `RegisterAgencyPage.tsx` llama `registerAgencyApi`; campos nombre, NIT, email, contraseña presentes |

**Cumple:** ✅

---

### HU-04 — Registro de guía por agencia

**Criterios de aceptación verificados:**
- CA-01 La agencia puede registrar un guía con nombre, documento, número de certificado y fecha de vencimiento
- CA-02 El número de certificado debe ser único en el sistema
- CA-03 La fecha de vencimiento del certificado debe ser futura

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `AgencyController.RegisterGuide` → `GuideFactory.Create`; valida cert. único con `userRepository.ExistsGuideCertificateAsync`; valida fecha futura |
| Frontend | ✅ | `AgencyGuidesPage.tsx` tiene modal de registro y llama `registerGuideApi` |

**Cumple:** ✅

---

### HU-05 — Login turista

**Criterios de aceptación verificados:**
- CA-01 El turista puede iniciar sesión con email y contraseña válidos
- CA-02 El sistema devuelve JWT y redirige al dashboard de turista
- CA-03 Tras 5 intentos fallidos la cuenta se bloquea 15 minutos

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `AuthService` verifica `LockoutUntil` antes de contraseña; bloqueo `AddMinutes(15)`; `TouristAuthStrategy` devuelve `RedirectUrl = /turista/inicio` |
| Frontend | ✅ | `LoginPage.tsx` redirige por rol; muestra error en Alert destructive |

**Cumple:** ✅

---

### HU-06 — Login agencia

**Criterios de aceptación verificados:**
- CA-01 La agencia puede iniciar sesión
- CA-02 Si está en estado `Pendiente`, el sistema notifica que la solicitud está en revisión
- CA-03 Si está `Suspendida`, el sistema notifica la suspensión

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `AgencyAuthStrategy.AuthenticateAsync` retorna `AlertMessage` para Pending y Suspended |
| Frontend | ✅ | `LoginPage.tsx` muestra `result.error` (que mapea el `AlertMessage`) en Alert |

**Cumple:** ✅

---

### HU-07 — Login guía

**Criterios de aceptación verificados:**
- CA-01 El guía puede iniciar sesión
- CA-02 Si el certificado está vencido, el sistema muestra una alerta al ingresar

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `GuideAuthStrategy.AuthenticateAsync` incluye `AlertMessage` si `CertificateExpiryDate <= Now` |
| Frontend | ⚠️ | `LoginPage.tsx` muestra el `result.error` (AlertMessage) pero con variante `destructive`; semánticamente funciona aunque el color puede confundirse con error de credenciales |

**Cumple parcialmente:** ⚠️  
**Brecha:** el `AlertMessage` de certificado vencido aparece con el mismo estilo que un error de login; idealmente debería ser una advertencia amarilla, no roja.

---

### HU-09 — Gestión de usuarios por admin (consulta + eliminación)

**Criterios de aceptación verificados:**
- CA-01 El admin puede ver la lista de todos los usuarios
- CA-02 El admin puede filtrar por rol
- CA-03 Al eliminar turista, el sistema valida que no tenga reservas `Confirmed` o `Completed` activas (RN-15)
- CA-04 Al eliminar agencia, valida que no tenga reservas `Confirmed` (RN-16)

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `AdminController.GetUsers` ✅; `DeleteUser → AdminService.DeleteUserAsync` implementa RN-15/16 |
| Frontend | ✅ | `AdminUsersPage.tsx` — filtro por rol, botón Eliminar con `confirm()`, llama `deleteUserApi` |

**Cumple:** ✅

---

### HU-10 — Consulta de guías por agencia

**Criterios de aceptación verificados:**
- CA-01 La agencia ve solo sus propios guías
- CA-02 El listado incluye estado del certificado y días para vencimiento

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `AgencyController.GetGuides → guideRepository.GetByAgencyAsync`; `GuideResponseDTO` incluye `DaysToExpiry` |
| Frontend | ✅ | `AgencyGuidesPage.tsx` llama `getAgencyGuidesApi`; muestra alerta visual si <30 días |

**Cumple:** ✅

---

### HU-11 — Actualización de perfil de turista

**Criterios de aceptación verificados:**
- CA-01 El turista puede actualizar nombre y teléfono
- CA-02 El email no es editable

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `TouristController.UpdateProfile` — actualiza `FullName` y `Phone`; email no en `UpdateTouristProfileRequestDTO` |
| Frontend | ✅ | `TouristProfilePage.tsx` — campo email deshabilitado; llama `updateProfileApi` |

**Cumple:** ✅

---

### HU-12 — Actualización de certificado de guía

**Criterios de aceptación verificados:**
- CA-01 La agencia puede actualizar el certificado de un guía
- CA-02 El certificado anterior queda archivado en el historial

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `AgencyController.UpdateCertificate → AgencyService.UpdateCertificateAsync` archiva en `CertificateHistory` |
| Frontend | ✅ | `AgencyGuidesPage.tsx` tiene modal de actualización y llama `updateCertificateApi` |

**Cumple:** ✅

---

### HU-13 — Suspensión de usuario por admin

**Criterios de aceptación verificados:**
- CA-01 El admin debe ingresar un motivo de suspensión obligatorio
- CA-02 El usuario suspendido no puede iniciar sesión

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `AdminController.SuspendUser` valida `dto.Reason` no vacío; `AdminService.SuspendUserAsync` cambia a `Suspended` y guarda `SuspensionReason`; las strategies de login verifican status |
| Frontend | ✅ | `AdminUsersPage.tsx` — modal con textarea de motivo, botón deshabilitado si motivo vacío |

**Cumple:** ✅

---

### HU-14 — Eliminación de cuenta por turista

**Criterios de aceptación verificados:**
- CA-01 El turista puede solicitar eliminar su cuenta
- CA-02 El sistema valida que no tenga reservas activas (TOURIST-01/02)
- CA-03 Se requiere confirmación de contraseña

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `TouristController.DeleteAccount → AdminService.DeleteUserAsync` verifica RN-15; requiere contraseña en `DeleteAccountRequestDTO` |
| Frontend | ✅ | `TouristProfilePage.tsx` — modal de confirmación con campo contraseña; llama `deleteAccountApi` |

**Cumple:** ✅

---

### HU-15 — Recuperación de contraseña

**Criterios de aceptación verificados:**
- CA-01 El usuario puede solicitar recuperar su contraseña por email
- CA-02 Se genera un token de un solo uso con expiración de 30 minutos
- CA-03 El token se invalida tras usarse
- CA-04 Si el email no está registrado, la respuesta es igual (sin revelar datos)
- CA-05 El usuario puede establecer una nueva contraseña con el token

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ❌ | No existe `POST /auth/forgot-password` ni `POST /auth/reset-password` en `AuthController.cs` |
| Frontend | ❌ | `ForgotPasswordPage.tsx` solo muestra un `Alert` informativo; no conecta a ningún endpoint; no existe `ResetPasswordPage.tsx` |

**No cumple:** ❌  
**Brecha:** pendiente de implementar completo (back + front + ruta `/reset-password`).

---

## ÉPICA 2 — Gestión de servicios

---

### HU-17 — Creación de tour

**Criterios de aceptación verificados:**
- CA-01 La agencia puede crear un tour con todos sus atributos
- CA-02 El estado inicial del tour es `Inactivo` (requiere guía para activarse)
- CA-03 Se genera un código único al crear el tour
- CA-04 El precio debe ser mayor a cero

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `TourController.Create` genera `Code = TG-{timestamp}-{random}`; asigna `Status = Inactive`; valida `Price > 0` y `TotalCapacity > 0` |
| Frontend | ✅ | `AgencyCreateTourPage.tsx` — formulario completo incluyendo campo URL imagen opcional, fecha mínima hoy; llama `POST /tour` |

**Cumple:** ✅

---

### HU-19 — Asignación de guía a tour

**Criterios de aceptación verificados:**
- CA-01 La agencia puede asignar un guía a un tour y este se activa si también tiene vehículo
- CA-02 GUIDE-01: el guía debe tener certificado vigente
- CA-03 GUIDE-03: el tour debe iniciar en más de 24 horas
- CA-04 GUIDE-04: el guía no debe tener conflicto de horario con otro tour

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `TourController.AssignGuide` verifica cert. vigente, >24h, conflicto horario; activa tour si también tiene vehículo |
| Frontend | ✅ | `AgencyToursPage.tsx` — modal de asignación con selector de guías; llama `POST /tour/{id}/guides` |

**Cumple:** ✅

---

### HU-21 — Exploración del catálogo público

**Criterios de aceptación verificados:**
- CA-01 Cualquier usuario (sin login) puede ver el catálogo de tours activos
- CA-02 Se puede filtrar por categoría y ciudad

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `TourController.GetAll` con `[AllowAnonymous]`; filtra `Status == Active`; acepta `?category=` y `?city=` |
| Frontend | ✅ | `ToursPublicPage.tsx` — filtros por categoría y búsqueda; `TourCard` muestra agencia y rating |

**Cumple:** ✅

---

### HU-22 — Tours asignados al guía

**Criterios de aceptación verificados:**
- CA-01 El guía puede ver sus tours asignados
- CA-02 Cada tour muestra la información del vehículo asignado

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `GuideController.GetTours` filtra por `guideId` del JWT; `AssignedTourResponseDTO` incluye `AssignedTourVehicleDTO` |
| Frontend | ✅ | `GuideToursPage.tsx` y `GuideDashboard.tsx` llaman `getMyToursAsGuideApi` |

**Cumple:** ✅

---

### HU-23 — Edición de tour

**Criterios de aceptación verificados:**
- CA-01 La agencia puede editar los atributos del tour
- CA-02 No se puede reducir la capacidad por debajo de las reservas existentes

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `TourController.Update` verifica que `dto.TotalCapacity >= occupiedSpots`; actualiza todos los campos incluyendo `ImageUrl` |
| Frontend | ✅ | `AgencyToursPage.tsx` — modal de edición; llama `PUT /tour/{id}` |

**Cumple:** ✅

---

### HU-24 — Períodos de no disponibilidad del guía

**Criterios de aceptación verificados:**
- CA-01 El guía puede registrar un período de no disponibilidad con fecha inicio y fin
- CA-02 La fecha de inicio no puede ser en el pasado
- CA-03 No puede solaparse con tours ya asignados

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `GuideController.AddUnavailability` valida fecha pasada y solapamiento con tours |
| Frontend | ✅ | `GuideAvailabilityPage.tsx` — modal con fechas; llama `addUnavailabilityApi` y `deleteUnavailabilityApi` |

**Cumple:** ✅

---

### HU-25 / HU-26 — Desactivación de tour (agencia y admin)

**Criterios de aceptación verificados:**
- CA-01 Se puede desactivar un tour activo
- CA-02 Se requiere un motivo de desactivación
- CA-03 No se puede desactivar si tiene reservas `Confirmed` futuras

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `TourController.Deactivate` verifica `HasFutureConfirmedReservationsAsync`; guarda `DeactivationReason` |
| Frontend | ✅ | `AgencyToursPage.tsx` y `AdminServicesPage.tsx` — modal con campo motivo obligatorio |

**Cumple:** ✅

---

### HU-28B — Asignación de vehículo a tour

**Criterios de aceptación verificados:**
- CA-01 La agencia puede asignar un vehículo a un tour
- CA-02 VEHICLE-01: el vehículo debe estar disponible
- CA-03 VEHICLE-02: la capacidad del vehículo debe ser >= cupos del tour

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `TourController.AssignVehicle` verifica `VehicleStatus.Available` y `PassengerCapacity >= TotalCapacity`; activa tour si también tiene guía |
| Frontend | ✅ | `AgencyAssignVehiclePage.tsx` — cards de vehículos con validación visual; llama `POST /tour/{id}/vehicle` |

**Cumple:** ✅

---

### HU-55 — Calificación del tour

**Criterios de aceptación verificados:**
- CA-01 El turista puede calificar un tour solo si su reserva está en estado `Completada`
- CA-02 Solo se puede enviar una calificación por reserva
- CA-03 La calificación es entre 1 y 5 estrellas; comentario opcional

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `ReservationController.Review` valida `Status == Completed`, unicidad con `reviewRepo.ExistsByReservationAsync`, rango 1–5; recalcula `AverageRating` del tour |
| Frontend | ✅ | `TouristReservationsPage.tsx` — modal de calificación con estrellas; llama `POST /reservation/{id}/review` |

**Cumple:** ✅

---

## ÉPICA 3 — Gestión de transporte

---

### HU-27 — Registro de vehículo

**Criterios de aceptación verificados:**
- CA-01 La agencia puede registrar un vehículo con placa, marca, modelo, año y capacidad
- CA-02 La placa debe ser única
- CA-03 La placa debe tener formato colombiano (AAA-000)

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `VehicleController.Register` valida formato placa con regex y unicidad en agencia |
| Frontend | ✅ | `AgencyFleetPage.tsx` — modal de registro; llama `registerVehicleApi` |

**Cumple:** ✅

---

### HU-29/30 — Vehículo visible para turista y guía

**Criterios de aceptación verificados:**
- CA-01 El turista puede ver la información del vehículo asignado al tour
- CA-02 El guía puede ver el vehículo asignado a cada tour

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ⚠️ | `TourResponseDTO` incluye `VehicleId` pero no el nombre/placa del vehículo; `AssignedTourResponseDTO` sí incluye `AssignedTourVehicleDTO` (solo para guías) |
| Frontend | ⚠️ | `TourDetailPage.tsx` no muestra datos del vehículo; `GuideToursPage.tsx` sí muestra placa, marca y modelo |

**Cumple parcialmente:** ⚠️  
**Brecha:** el turista no puede ver los datos del vehículo desde el detalle del tour ni desde su reserva. Solo los guías tienen esta información.

---

### HU-32 — Cambio de estado de vehículo

**Criterios de aceptación verificados:**
- CA-01 La agencia puede cambiar el estado entre `Disponible` y `En mantenimiento`
- CA-02 VEHICLE-03: no se puede poner en mantenimiento si tiene tours activos

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `VehicleController.ChangeStatus` valida con `vehicleRepository.HasFutureToursAsync` antes de cambiar a `InMaintenance` |
| Frontend | ✅ | `AgencyFleetPage.tsx` — toggle de estado; llama `changeVehicleStatusApi` |

**Cumple:** ✅

---

### HU-34 — Eliminación de vehículo

**Criterios de aceptación verificados:**
- CA-01 La agencia puede eliminar un vehículo
- CA-02 No se puede eliminar si tiene tours futuros activos

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `VehicleController.Delete` verifica `vehicleRepository.HasFutureToursAsync` antes de eliminar |
| Frontend | ✅ | `AgencyFleetPage.tsx` — botón eliminar deshabilitado si `Status == Assigned`; llama `deleteVehicleApi` |

**Cumple:** ✅

---

## ÉPICA 4 — Gestión de reservas

---

### HU-35 — Realización de reserva

**Criterios de aceptación verificados:**
- CA-01 El turista puede reservar un tour con fecha futura
- CA-02 La fecha del tour no puede ser pasada
- CA-03 El sistema valida que haya cupos disponibles

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `ReservationFacade.ConfirmBookingAsync` valida `TourDate >= hoy`, cupos y conflicto horario |
| Frontend | ✅ | `TourDetailPage.tsx` — botón deshabilitado si `availableSpots == 0`; llama `createReservationApi` |

**Cumple:** ✅

---

### HU-38 — Alerta de cruce de horarios

**Criterios de aceptación verificados:**
- CA-01 Si el turista intenta reservar un tour que se solapa con otro ya confirmado, el sistema rechaza y muestra el conflicto

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `ReservationFacade.ConfirmBookingAsync` detecta solapamiento de `StartTime/EndTime` en la misma `TourDate`; retorna mensaje con el tour en conflicto |
| Frontend | ✅ | `TourDetailPage.tsx` captura el error 409 y lo muestra con `toast.error` |

**Cumple:** ✅

---

### HU-39 — Historial de reservas del turista

**Criterios de aceptación verificados:**
- CA-01 El turista puede ver todas sus reservas con estado
- CA-02 Puede filtrar por estado (Confirmada, Completada, Cancelada)

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `ReservationController.GetMine` filtra por `TouristId` del JWT; incluye `AgencyName` |
| Frontend | ✅ | `TouristReservationsPage.tsx` — filtros por estado; muestra agencia; llama `getMyReservationsApi` |

**Cumple:** ✅

---

### HU-40 — Reservas de la agencia

**Criterios de aceptación verificados:**
- CA-01 La agencia puede ver todas las reservas de sus tours

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `ReservationController.GetAgencyReservations` filtra por `AgencyId` del JWT |
| Frontend | ✅ | `AgencyReservationsPage.tsx` llama `getAgencyReservationsApi` |

**Cumple:** ✅

---

### HU-41 — Turistas inscritos en un tour (guía)

**Criterios de aceptación verificados:**
- CA-01 El guía puede ver el listado de turistas que tienen reserva confirmada en un tour asignado

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ❌ | No existe un endpoint `GET /guide/tours/{id}/tourists` ni equivalente |
| Frontend | ⚠️ | `GuideToursPage.tsx` tiene botón "Ver turistas" que abre un modal con solo el recuento de cupos, no el listado real |

**No cumple:** ❌  
**Brecha:** falta endpoint backend y lógica frontend para mostrar el listado de turistas por tour.

---

### HU-42 — Marcar reserva como completada

**Criterios de aceptación verificados:**
- CA-01 La agencia puede marcar una reserva como completada
- CA-02 Solo se puede completar si el tour ya ocurrió (RES-06)

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `ReservationFacade.CompleteBookingAsync` valida `tourDateTime <= UtcNow` y propietario de la reserva |
| Frontend | ✅ | `AgencyReservationsPage.tsx` — botón visible si tour está en el pasado; llama `completeReservationApi` |

**Cumple:** ✅

---

### HU-43 — Cambio de fecha de reserva

**Criterios de aceptación verificados:**
- CA-01 El turista puede cambiar la fecha de una reserva confirmada
- CA-02 Solo si faltan más de 24 horas para la fecha original del tour
- CA-03 La nueva fecha debe ser futura

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ❌ | No existe `PATCH /reservation/{id}/reschedule` ni `RescheduleBookingAsync` en `IReservationFacade` |
| Frontend | ❌ | `TouristReservationDetailPage.tsx` tiene el botón "Cambiar fecha" en el JSX pero sin handler ni modal |

**No cumple:** ❌  
**Brecha:** pendiente de implementar en backend (facade + controller) y frontend (modal + handler).

---

### HU-44 — Cancelación de reserva

**Criterios de aceptación verificados:**
- CA-01 El turista puede cancelar una reserva confirmada
- CA-02 Solo con más de 24 horas de anticipación (RN-08)
- CA-03 La factura asociada queda anulada (RN-18)

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `ReservationFacade.CancelBookingAsync` valida 24h, cambia estado a `Cancelled` y pone factura en `Voided` |
| Frontend | ✅ | `TouristReservationsPage.tsx` — modal de confirmación; llama `cancelReservationApi` |

**Cumple:** ✅

---

## ÉPICA 5 — Gestión de facturas

---

### HU-47 — Factura manual de agencia

**Criterios de aceptación verificados:**
- CA-01 La agencia puede emitir una factura manual para una reserva, con monto y descripción del ajuste

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ❌ | No existe `POST /invoice/agency/manual`; la entidad `Invoice` no tiene campo `IsManual` ni `ManualDescription` |
| Frontend | ❌ | `AgencyInvoicesPage.tsx` no tiene botón "Emitir factura manual" |

**No cumple:** ❌  
**Brecha:** pendiente migración EF (`IsManual`, `ManualDescription`), endpoint y UI.

---

### HU-48 — Facturas del turista

**Criterios de aceptación verificados:**
- CA-01 El turista puede ver el listado de sus facturas
- CA-02 Puede ver el detalle (número, tour, fecha, monto, estado)

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `InvoiceController.GetMyInvoices` filtra por `TouristId` del JWT; `InvoiceTouristResponseDTO` incluye número, tour, fecha, monto y estado |
| Frontend | ✅ | `TouristInvoicesPage.tsx` — tabla y modal de preview; llama `getMyInvoicesApi` |

**Cumple:** ✅

---

### HU-49 — Histórico de facturas de agencia

**Criterios de aceptación verificados:**
- CA-01 La agencia puede ver sus facturas con filtro por rango de fechas
- CA-02 Muestra monto bruto, retención y monto neto

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `InvoiceController.GetAgencyInvoices` filtra por `AgencyId` y fechas opcionales; `InvoiceAgencyResponseDTO` incluye `Amount`, `RetentionAmount`, `NetAmount` |
| Frontend | ✅ | `AgencyInvoicesPage.tsx` — filtros de fecha y estado; llama `getAgencyInvoicesApi` |

**Cumple:** ✅

---

### HU-50 — Reporte global de facturación (admin)

**Criterios de aceptación verificados:**
- CA-01 El admin puede ver totales por período (emitidas, anuladas, ingresos netos)
- CA-02 Desglose de retenciones por agencia

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `InvoiceController.GetAdminReport` usa `BillingReportDirector` + `AdminBillingReportBuilder`; devuelve `AdminBillingReportDTO` con `ByAgency[]`, totales y período |
| Frontend | ✅ | `AdminReportsPage.tsx` — selector de período, KPIs, tabla por agencia; llama `getAdminBillingReportApi` |

**Cumple:** ✅

---

### HU-51 — Panel administrativo

**Criterios de aceptación verificados:**
- CA-01 El admin puede ver KPIs globales: usuarios registrados, agencias pendientes, tours activos, ingresos

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | ✅ | `AdminController.GetUsers`, `InvoiceController.GetAdminItems`, `TourController.GetAll` proveen los datos |
| Frontend | ✅ | `AdminDashboard.tsx` — KPIs, solicitudes pendientes destacadas; llama tres servicios API |

**Cumple:** ✅

---

### HU-52 — Descarga de factura en PDF

**Criterios de aceptación verificados:**
- CA-01 El turista puede descargar su factura como PDF

| Capa | Estado | Evidencia |
|---|---|---|
| Backend | — | No aplica para la solución elegida (`window.print()`) |
| Frontend | ❌ | `TouristInvoicesPage.tsx` tiene botón "Descargar" que llama `toast.success` en lugar de `window.print()`; no existe `id="invoice-print-area"` en el modal; no hay `@media print` con aislamiento del área de impresión |

**No cumple:** ❌  
**Brecha:** falta agregar `id="invoice-print-area"` al div del modal, implementar `window.print()` en el handler y verificar que el CSS `@media print` ya agregado en `index.css` funcione correctamente.

---

## Resumen ejecutivo

### Estado por épica

| Épica | HUs auditadas | ✅ Cumple | ⚠️ Parcial | ❌ No cumple |
|---|---|---|---|---|
| 1 — Gestión de usuarios | 11 | 9 | 1 | 1 |
| 2 — Gestión de servicios | 8 | 7 | 0 | 1 |
| 3 — Gestión de transporte | 4 | 3 | 1 | 0 |
| 4 — Gestión de reservas | 7 | 5 | 0 | 2 |
| 5 — Gestión de facturas | 5 | 3 | 0 | 2 |
| **Total** | **35** | **27** | **2** | **6** |

---

### HUs que no cumplen (acción requerida)

| HU | Título | Brecha concreta | Ref. detalle |
|---|---|---|---|
| **HU-15** | Recuperación de contraseña | Falta `POST /auth/forgot-password`, `POST /auth/reset-password` y `ResetPasswordPage.tsx` | [PENDIENTES.md#hu-15](PENDIENTES.md#hu-15--recuperar-contraseña) |
| **HU-41** | Turistas en tour (guía) | Falta endpoint `GET /guide/tours/{id}/tourists` y UI en `GuideToursPage` | [PENDIENTES.md#hu-41](PENDIENTES.md#hu-41--turistas-inscritos-en-tour-vista-guía) |
| **HU-43** | Cambio de fecha de reserva | Falta `RescheduleBookingAsync` en facade, `PATCH /reservation/{id}/reschedule` y modal en `TouristReservationDetailPage` | [PENDIENTES.md#hu-43](PENDIENTES.md#hu-43--cambio-de-fecha-de-reserva) |
| **HU-47** | Factura manual de agencia | Falta campo `IsManual` en `Invoice`, migración EF, `POST /invoice/agency/manual` y botón en `AgencyInvoicesPage` | [PENDIENTES.md#hu-47](PENDIENTES.md#hu-47--factura-manual-de-agencia) |
| **HU-52** | Descarga de factura en PDF | Falta `id="invoice-print-area"` y `window.print()` en el botón Descargar de `TouristInvoicesPage` | [PENDIENTES.md#hu-52](PENDIENTES.md#hu-52--descarga-de-factura-en-pdf) |

### HUs parciales

| HU | Título | Brecha concreta |
|---|---|---|
| **HU-07** | Login guía | Alert de certificado vencido con estilo `destructive` (rojo) en lugar de advertencia (amarillo) |
| **HU-29/30** | Vehículo visible para turista | `TourResponseDTO` devuelve solo `VehicleId`; turista no ve placa/marca del vehículo en detalle del tour |

---

### Patrones GoF — estado vs diagrama PUML

| Patrón | Clase PUML | Estado |
|---|---|---|
| Factory | `TuristaFactory` | ✅ |
| Factory | `AgenciaFactory` | ✅ |
| Factory | `GuiaFactory` | ✅ — invocada desde `AgencyController` |
| Strategy | `TuristaAuthStrategy` | ✅ |
| Strategy | `AgenciaAuthStrategy` | ✅ |
| Strategy | `GuiaAuthStrategy` | ✅ |
| Strategy | `AdminAuthStrategy` | ✅ |
| Strategy | `AuthService` (contexto) | ✅ — lockout 15 min, orden correcto |
| Observer | `CapacityObserver` | ✅ |
| Observer | `InvoiceObserver` | ✅ — crea y anula factura |
| Observer | `TourStatusObserver` | ✅ — desactiva tours al suspender agencia |
| Observer | `NotificationObserver` | ⚠️ — stub (`Task.CompletedTask`), sin envío real de notificaciones |
| Observer | `CalificacionObserver` | ⚠️ — la lógica de recálculo está en el controller directamente, no wired como observer independiente |
| Facade | `ReservationFacade` | ✅ — fecha, cupos, cruce horario, cancelación, completar |
| Builder | `AdminBillingReportBuilder` | ✅ |
| Builder | `AgencyBillingReportBuilder` | ✅ |
| Builder | `TouristBillingReportBuilder` | ✅ |
| Builder | `BillingReportDirector` | ✅ |
