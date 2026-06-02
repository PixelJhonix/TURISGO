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

## Usuarios de prueba (ya creados automáticamente)

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | admin@turistgo.com | Admin123! |
| Agencia 1 | andes@turistgo.com | Agency123! |
| Agencia 2 | paisa@turistgo.com | Agency123! |
| Turista | tourist@turistgo.com | Tourist123! |
| Turista 2 | maria@turistgo.com | Tourist123! |
| Guía 1 (Andes) | guide1.2@turistgo.com | Guide123! |
| Guía 1 (Paisa) | guide1.4@turistgo.com | Guide123! |

> Los IDs de los guías (el número después del punto) dependen del orden en que se crean las agencias. Si la base de datos es nueva, las agencias reciben IDs 2 y 4 (el ID 1 es el admin). Si los emails de guía no funcionan, prueba con `guide1.3@turistgo.com` o revisa los IDs en Swagger o SQL Server.

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
