# TuristGo — Sistema de Turismo (Medellín)

Plataforma full-stack: backend ASP.NET Core 10 + frontend React/Vite.

---

## ¿Qué necesito para ejecutarlo?

Instala estas 3 herramientas. Si ya las tienes, salta directo a "Cómo ejecutar".

| Herramienta | Para qué sirve | Descarga |
|---|---|---|
| **.NET 10 SDK** | Ejecutar el servidor (backend) | [dotnet.microsoft.com/download](https://dotnet.microsoft.com/download) |
| **Node.js 20 LTS** | Ejecutar la interfaz web (frontend) | [nodejs.org](https://nodejs.org/) — botón "LTS" |
| **SQL Server LocalDB** | Base de datos local | Incluido con Visual Studio; o descarga [SQL Server Express](https://www.microsoft.com/es-es/sql-server/sql-server-downloads) |

> **Importante:** después de instalar Node.js, **cierra y abre la terminal** para que el comando `npm` funcione.

---

## Cómo ejecutar el proyecto

### Opción A — Script automático (más fácil)

Abre PowerShell en la carpeta `TuristGo` y ejecuta:

```powershell
.\start-dev.ps1
```

Si aparece un error de permisos:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
```

Esto arranca el backend y el frontend automáticamente.

---

### Opción B — Dos terminales por separado (más control)

**Terminal 1 — Backend** (servidor):

```powershell
cd TuristGo\back
dotnet run --project TuristGo.API
```

Espera hasta ver `Now listening on: http://localhost:5142`.  
La primera vez crea la base de datos y los datos de prueba automáticamente. No hagas nada más.

**Terminal 2 — Frontend** (interfaz web):

```powershell
cd TuristGo\Front

# Solo la primera vez — instala las librerías necesarias (puede tardar 1-2 minutos):
npm install

# Crea el archivo de configuración copiando el ejemplo:
copy .env.example .env

# Inicia la interfaz:
npm run dev
```

Abre el navegador en **http://localhost:5173**

---

## Datos de prueba (creados automáticamente al arrancar)

> **Primera vez:** el backend crea y llena la base de datos solo. No necesitas hacer nada extra.  
> **Reiniciar datos:** elimina el archivo `.mdf` de LocalDB (o la base `TuristGoDB` desde SQL Server Management Studio) y vuelve a arrancar el backend.

---

### Usuarios

#### Administrador

| Email | Contraseña | Estado |
|---|---|---|
| admin@turistgo.com | Admin123! | Activo |

#### Agencias

| Email | Contraseña | Nombre comercial | Estado | Para probar |
|---|---|---|---|---|
| andes@turistgo.com | Agency123! | Andes Tours Medellín | Activo | Flujo completo de agencia |
| paisa@turistgo.com | Agency123! | Paisa Experience | Activo | Segunda agencia independiente |
| nueva@turistgo.com | Agency123! | Nueva Aventura SAS | **Pendiente** | Flujo de aprobación desde admin |
| suspendida@turistgo.com | Agency123! | Tours Suspendidos SA | **Suspendida** | Flujo de reactivación desde admin |

#### Turistas

| Email | Contraseña | Estado | Para probar |
|---|---|---|---|
| tourist@turistgo.com | Tourist123! | Activo | Turista principal — tiene reservas de todos los estados |
| maria@turistgo.com | Tourist123! | Activo | Reservas en tours con capacidad baja |
| carlos@turistgo.com | Tourist123! | Activo | Reserva completada sin calificar aún |
| ana@turistgo.com | Tourist123! | Activo | Reservas en tours futuros distintos |
| pendiente@turistgo.com | Tourist123! | **Pendiente** | Cuenta sin activar |
| suspend@turistgo.com | Tourist123! | **Suspendido** | Login bloqueado por suspensión |

#### Guías — escenarios de certificado

| Email | Contraseña | Agencia | Certificado | Para probar |
|---|---|---|---|---|
| guide1.1@turistgo.com | Guide123! | Andes Tours | Vigente (2 años) | Asignación normal — caso feliz |
| guide2.1@turistgo.com | Guide123! | Andes Tours | Vence en **15 días** | GUIDE-01 borde: asignación debe fallar |
| guide3.1@turistgo.com | Guide123! | Andes Tours | Vence **mañana** | Límite extremo de cert vigente |
| guide4.1@turistgo.com | Guide123! | Andes Tours | Vencido **ayer** | GUIDE-01: asignación debe rechazarse |
| guide5.1@turistgo.com | Guide123! | Andes Tours | Vencido hace **1 año** | Claramente inválido |
| guide6.1@turistgo.com | Guide123! | Andes Tours | Vigente | Cuenta **suspendida** |
| guide1.2@turistgo.com | Guide123! | Paisa Experience | Vigente (18 meses) | Guía activo Paisa |
| guide2.2@turistgo.com | Guide123! | Paisa Experience | Vence en **29 días** | Borde "próximo a vencer" |
| guide3.2@turistgo.com | Guide123! | Paisa Experience | Vencido hace **6 meses** | Cert claramente inválido |

> **Nota:** los IDs en el email (`guide1.1`, `guide2.1`, etc.) son fijos desde la primera ejecución del seeder. El número antes del punto es el índice del guía (1–6 para Andes, 1–3 para Paisa); el número después del punto corresponde al ID de la agencia en BD.

---

### Tours de prueba

| Código | Nombre | Escenario especial |
|---|---|---|
| TG-AND-001 | Comuna 13 Graffiti Tour | Tour en 30 días — cancelable y reprogramable |
| TG-AND-002 | Guatapé y Piedra del Peñol | Tour en 3 días, 5 cupos — borde cancelación |
| TG-AND-003 | Tour Gastronómico El Poblado | Tour **mañana** — exactamente >24h |
| TG-AND-004 | Noche de Tango en Medellín | Tour en **<24h** — cancelación y reprogramación bloqueadas |
| TG-AND-005 | Recorrido Histórico Centro | Tour **en curso hoy** |
| TG-AND-006 | Parapente San Félix AGOTADO | **0 cupos disponibles** — debe mostrar "Agotado" |
| TG-AND-007 | Finca Cafetera Jericó | Guía con cert que vence en 15 días |
| TG-AND-008 | Ruta de las Orquídeas | **Inactivo** — sin guía ni vehículo |
| TG-AND-009 | Tour Nocturno Barrio Laureles | Inactivo — guía con cert vencido ayer |
| TG-AND-010 | Cañón del Río Claro | Inactivo — guía con cert vencido hace 1 año |
| TG-PAI-001 | City Tour Centro Histórico | Tour en 7 días — dos horarios |
| TG-PAI-002 | Coffee Farm Experience | Tour en 14 días, 25 cupos |
| TG-PAI-003 | Rapel Cañón Las Palmas | Tour en 2 días, guía cert vence en 29 días |
| TG-PAI-004 | Glamping Río Arví | Tour en 10 días, precio alto ($380.000), 1 cupo restante |
| TG-PAI-005 | Visita Pueblito Paisa | Guía con cert vencido (asignación legacy errónea) |
| TG-PAI-006 | Kayak Embalse El Peñol | **Inactivo** — sin asignaciones |
| TG-PAI-007 | Selfie Tour Instagram | Precio mínimo ($25.000), dos turnos en el mismo día |

---

### Reservas precargadas (turista principal: tourist@turistgo.com)

| Reserva | Tour | Estado | Para probar |
|---|---|---|---|
| R01 | TG-AND-001 (30 días) | **Confirmada** | Cancelación y cambio de fecha posibles |
| R02 | TG-AND-002 (3 días) | **Confirmada** | Cancelación posible (>24h) |
| R03 | TG-AND-004 (<24h) | **Confirmada** | Cancelación **bloqueada** por regla 24h |
| R04 | TG-AND-001 (hace 10 días) | **Completada** | Ya tiene reseña (rating 5★) |
| R05 | TG-PAI-001 (hace 5 días) | **Completada** | Ya tiene reseña (rating 4★) |
| R06 | TG-PAI-002 (hace 20 días) | **Cancelada** | Factura anulada — historial |
| R09 | TG-AND-003 (hace 3 días) | **Completada** | **Sin reseña** — flujo de calificación activo |

TG-AND-006 está **lleno** (2/2 cupos): maria y carlos tienen reservas en ese tour.

---

## URLs del sistema en desarrollo

| ¿Qué? | Dirección |
|---|---|
| Interfaz web (frontend) | http://localhost:5173 |
| Servidor (backend) | http://localhost:5142 |
| Swagger (probar API) | http://localhost:5142/swagger |

---

## Cómo probar la API con Swagger

1. Ve a http://localhost:5142/swagger
2. Expande `POST /api/auth/login`, haz clic en **Try it out**
3. Pega: `{ "email": "tourist@turistgo.com", "password": "Tourist123!" }`
4. Ejecuta y copia el valor de `token` de la respuesta
5. Haz clic en **Authorize** (arriba a la derecha) → escribe `Bearer ` + el token
6. Ahora puedes probar cualquier endpoint protegido

---

## Estructura del proyecto

```
TuristGo/
├── back/                  ← Servidor (lógica de negocio + base de datos)
│   ├── TuristGo.API/      ← Endpoints REST, autenticación JWT
│   ├── TuristGo.Domain/   ← Reglas de negocio, patrones de diseño (GoF)
│   └── TuristGo.DataAccess/ ← Repositorios y migraciones EF Core
└── Front/                 ← Interfaz web
    └── src/app/
        ├── pages/         ← Pantallas por rol (admin, agencia, guía, turista)
        ├── components/    ← Componentes reutilizables
        └── lib/api/       ← Conexiones al backend
```

---

## Solución de problemas

| Problema | Solución |
|---|---|
| `npm` no se reconoce | Instala Node.js LTS. Cierra y abre la terminal. Verifica con `node -v` |
| La base de datos no se crea | Verifica que LocalDB esté instalado: ejecuta `sqllocaldb info` en PowerShell |
| El frontend no muestra datos | Asegúrate de que el backend esté corriendo y que `Front/.env` tenga `VITE_API_URL=http://localhost:5142/api` |
| Puerto ya en uso | Cambia el puerto en `back/TuristGo.API/Properties/launchSettings.json` y actualiza `Front/.env` |
| Error CORS | Los orígenes permitidos son: 5173, 3000, 4200. Si usas otro puerto, agrégalo en `Program.cs` |
| `%1 is not a valid Win32 application` con el script | El script usa `npm.cmd`. Si el error persiste, ejecuta el backend y frontend por separado (Opción B) |

---

## Tecnologías

- **Backend:** ASP.NET Core 10, Entity Framework Core, SQL Server LocalDB, JWT, AutoMapper
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router 7
- **Patrones GoF:** Factory Method, Strategy, Observer, Facade, Builder
- **Arquitectura:** N capas separadas en proyectos distintos

---

## Documentación adicional

- Plan de fases y auditoría: [MASTER_PLAN.md](MASTER_PLAN.md)
- Diagrama de clases: [TuristGo_Merge_Completo.puml](TuristGo_Merge_Completo.puml)
- Detalle técnico del backend: [back/README.md](back/README.md)
