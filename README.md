# Ong Gio Project Summary

This repository contains a full-stack quoting and production management system for HVAC ductwork.

## High-Level Architecture

- `src/` - ASP.NET Core backend
- `frontend/ong-gio-web/` - React + TypeScript frontend

The backend provides authentication, master data management, quotation calculation, dashboard statistics, and Excel export. The frontend provides the admin UI for login, dashboard, order management, material management, product group management, and user management.

## Backend Summary

The backend is organized as a layered .NET solution:

- `OngGio.Api` - HTTP API endpoints, JWT auth, CORS, Swagger, startup seeding
- `OngGio.Application` - calculation engine and application abstractions
- `OngGio.Domain` - core entities and shared domain models
- `OngGio.Infrastructure` - EF Core persistence, business services, security helpers, seed data

Main backend capabilities:

- Login with captcha and JWT
- Dashboard statistics
- Manage quotation/order data
- Preview calculation results for duct parts
- Manage product groups and their technical parameters
- Manage material types and pricing data
- Manage users
- Export quotation details to Excel

## Frontend Summary

The frontend is a Vite React application that consumes the backend API.

Main client capabilities:

- Login screen with captcha
- Protected application shell with sidebar navigation
- Dashboard cards for operational and financial metrics
- Order list and order form
- Material management
- Product group management
- User management

## Key Source Areas

- Backend entry point: `src/OngGio.Api/Program.cs`
- Backend controllers: `src/OngGio.Api/Controllers/`
- Calculation engine: `src/OngGio.Application/Calculation/`
- Persistence and seeding: `src/OngGio.Infrastructure/`
- Frontend router: `frontend/ong-gio-web/src/App.tsx`
- Frontend API layer: `frontend/ong-gio-web/src/api.ts`
- Frontend auth layer: `frontend/ong-gio-web/src/authService.ts`
- Frontend pages: `frontend/ong-gio-web/src/pages/`

## Typical Flow

1. User logs in through the frontend.
2. The backend validates captcha and credentials, then returns a JWT token.
3. The frontend stores the token and routes the user into the protected area.
4. The user manages orders, materials, products, and users from the UI.
5. The frontend calls the API for calculations, statistics, CRUD operations, and Excel export.

## Detailed Docs

- Backend file-by-file summary: [`src/README.md`](D:\project_Ong_gio\src\README.md)
- Frontend file-by-file summary: [`frontend/ong-gio-web/README.md`](D:\project_Ong_gio\frontend\ong-gio-web\README.md)
