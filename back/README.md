# TuristGo Backend

Backend de TuristGo implementado con arquitectura por capas inspirada en SportsLeague:

- `TuristGo.API` (Controllers, DTOs, Mappings, Middleware, Program)
- `TuristGo.Domain` (Entities, Enums, Interfaces, Services, patrones GoF)
- `TuristGo.DataAccess` (DbContext, Repositories, Seeders)

## Requisitos

- .NET SDK 10
- SQL Server LocalDB (`(localdb)\mssqllocaldb`) o ajustar `DefaultConnection` en `TuristGo.API/appsettings.json`

## Configuración rápida

1. Ubícate en la carpeta del backend:
   - `cd TuristGo/Back`
2. Restaura dependencias:
   - `dotnet restore`
3. Revisa `TuristGo.API/appsettings.json`:
   - `ConnectionStrings:DefaultConnection`
   - `Jwt:SecretKey`, `Jwt:Issuer`, `Jwt:Audience`

## Ejecutar API

Desde `TuristGo/Back`:

- `dotnet run --project TuristGo.API`

La API quedará disponible en:

- `http://localhost:5142` (según profile local)
- Swagger: `http://localhost:5142/swagger`

## Integración con Frontend

En `TuristGo/Front/.env` (tomar de `.env.example`):

- `VITE_API_URL=http://localhost:5142/api`

Luego iniciar frontend:

- `npm install`
- `npm run dev`

## Credenciales seed (desarrollo)

- Admin: `admin@turistgo.com` / `Admin123!`
- Agency: `agency@turistgo.com` / `Agency123!`
- Tourist: `tourist@turistgo.com` / `Tourist123!`

## Migraciones

La API aplica migraciones y seed automáticamente al iniciar. Para comandos manuales, ver el [README global](../README.md) en la carpeta `TuristGo`.
