# TuristGo — Sistema Integral de Turismo (Medellín)

Plataforma full-stack: backend ASP.NET Core 10 + frontend React/Vite.

## Requisitos previos

| Herramienta | Versión mínima |
|-------------|----------------|
| [.NET SDK](https://dotnet.microsoft.com/download) | 10.0 |
| [Node.js](https://nodejs.org/) | 20 LTS |
| SQL Server LocalDB | `(localdb)\mssqllocaldb` (incluido con Visual Studio) |

Opcional: Visual Studio 2022+ con carga de trabajo **ASP.NET y desarrollo web**.

> **Windows / PowerShell:** no uses `open` ni `run` (son de macOS o de otros entornos). Para el script usa `.\start-dev.ps1` (ver abajo). Si `npm` no se reconoce, instala [Node.js LTS](https://nodejs.org/) y **reinicia la terminal**.

---

## Estructura del proyecto

```
TuristGo/
├── README.md          ← este archivo (guía global)
├── start-dev.ps1      ← arranque rápido API + frontend
├── back/              ← solución .NET (API, Domain, DataAccess)
│   └── TuristGo.slnx
└── Front/             ← React + Vite (puerto 5173)
```

---

## Paso a paso: ejecutar el software completo

### Opción A — Visual Studio (recomendada, un solo F5)

1. Abre la solución [`back/TuristGo.slnx`](back/TuristGo.slnx).
2. Establece **TuristGo.API** como proyecto de inicio (clic derecho → *Set as Startup Project*).
3. En el selector de perfiles de depuración, elige **https** o **http**.
4. La primera vez, instala dependencias del frontend:
   ```powershell
   cd Front
   npm install
   ```
5. Pulsa **F5** (Start Debugging).
   - La API arranca en `http://localhost:5142` (y `https://localhost:7251` si usas perfil https).
   - **SpaProxy** lanza automáticamente `npm run dev` en `Front/`.
   - El navegador abre el **frontend** en `http://localhost:5173`.
6. Para Swagger: navega a `http://localhost:5142/swagger` (o usa la redirección desde `/`).
7. Para ver la base de datos en Visual Studio:
   - *View* → *SQL Server Object Explorer*
   - `(localdb)\mssqllocaldb` → *Databases* → **TuristGoDb**

> Perfil de solución alternativo: en VS 17.12+ puedes elegir **TuristGo Full Stack** si aparece (archivo [`back/TuristGo.slnLaunch`](back/TuristGo.slnLaunch)).

---

### Opción B — Script PowerShell (dos procesos, un comando)

Desde la carpeta `TuristGo`:

```powershell
cd C:\repositories\TuristGo
.\start-dev.ps1
```

Si PowerShell bloquea scripts:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
```

Abre el frontend y Swagger en el navegador. La API aplica migraciones y datos seed al iniciar.

**Solo backend** (si aún no tienes Node/npm):

```powershell
cd back
dotnet run --project TuristGo.API
```

Swagger: http://localhost:5142/swagger

---

### Opción C — Terminales separadas (control manual)

**Terminal 1 — Backend**

```powershell
cd TuristGo\back
dotnet restore
dotnet run --project TuristGo.API
```

**Terminal 2 — Frontend**

```powershell
cd TuristGo\Front
npm install
npm run dev
```

Abre:

- Frontend: http://localhost:5173  
- Swagger: http://localhost:5142/swagger  

---

## Configuración

### Base de datos

Cadena por defecto en [`back/TuristGo.API/appsettings.json`](back/TuristGo.API/appsettings.json):

```json
"DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=TuristGoDb;Trusted_Connection=true;TrustServerCertificate=true;"
```

Si LocalDB no está disponible, usa SQL Express y actualiza la cadena, por ejemplo:

```json
"Server=localhost\\SQLEXPRESS;Database=TuristGoDb;Trusted_Connection=true;TrustServerCertificate=true;"
```

### Migraciones EF Core (manual, si hace falta)

```powershell
cd TuristGo\back
dotnet ef migrations add InitialCreate --project TuristGo.DataAccess --startup-project TuristGo.API
dotnet ef database update --project TuristGo.DataAccess --startup-project TuristGo.API
```

> Al ejecutar la API, `MigrateAsync()` y el seeder se aplican automáticamente en Development.

### Frontend — URL de la API

Archivo [`Front/.env`](Front/.env) (copiar desde [`.env.example`](Front/.env.example)):

```env
VITE_API_URL=http://localhost:5142/api
```

---

## Credenciales de prueba (seed)

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@turistgo.com | Admin123! |
| Agencia 1 | andes@turistgo.com | Agency123! |
| Agencia 2 | paisa@turistgo.com | Agency123! |
| Turista | tourist@turistgo.com | Tourist123! |
| Guía (agencia Andes) | guide1.2@turistgo.com | Guide123! |
| Guía (agencia Paisa) | guide1.4@turistgo.com | Guide123! |

> Los emails de guías siguen el patrón `guide{n}.{agencyId}@turistgo.com` según el ID asignado al guardar las agencias.

---

## URLs de desarrollo

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| API HTTP | http://localhost:5142 |
| API HTTPS | https://localhost:7251 |
| Swagger | http://localhost:5142/swagger |
| OpenAPI JSON | http://localhost:5142/swagger/v1/swagger.json |

---

## Probar la API con JWT (Swagger)

1. `POST /api/auth/login` con body `{ "email": "tourist@turistgo.com", "password": "Tourist123!" }`.
2. Copia el `token` de la respuesta.
3. Clic en **Authorize** → `Bearer {token}`.
4. Prueba endpoints protegidos (por ejemplo `GET /api/auth/me`).

---

## Flujo de demostración sugerido

1. Abrir frontend → explorar catálogo de tours (datos del seed).
2. Iniciar sesión como turista → reservar un tour activo.
3. Ver factura generada (`GET /api/invoice` con token).
4. Iniciar sesión como admin → aprobar/suspender agencias en Swagger.
5. Revisar tablas en SQL Server Object Explorer.

---

## Solución de problemas

| Problema | Qué hacer |
|----------|-----------|
| Error `Role` / `UserRole` al iniciar | Asegúrate de tener el último código (discriminador TPH con enum). Rebuild solution. |
| No se crea la BD | Verifica LocalDB; ejecuta `dotnet ef database update` manualmente. |
| Frontend no carga datos | Comprueba que la API esté en 5142 y `Front/.env` apunte a `http://localhost:5142/api`. |
| `npm` no se reconoce | Instala Node.js LTS desde https://nodejs.org/ (opción *Add to PATH*). Cierra y abre PowerShell. Verifica con `node -v` y `npm -v`. |
| `open` / `run` no funcionan | En Windows usa `.\start-dev.ps1`, no `open` ni `run`. |
| `%1 is not a valid Win32 application` al usar el script | El script ya usa `npm.cmd` (no `npm.ps1`). Actualiza `start-dev.ps1` y vuelve a ejecutar. |
| SpaProxy no inicia Vite | Ejecuta `npm install` en `Front/`; verifica Node en PATH. Usa `start-dev.ps1` como alternativa. |
| CORS | Orígenes permitidos: 5173, 3000, 4200 (configurados en `Program.cs`). |

---

## Documentación adicional

- Plan de arquitectura: [`turistgo_backend_plan_1a99b470.plan.md`](turistgo_backend_plan_1a99b470.plan.md)
- Detalles técnicos del API: [`back/README.md`](back/README.md)
