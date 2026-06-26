# Stage 1: Build frontend (React/Vite)
FROM node:22-alpine AS frontend-build
WORKDIR /src/frontend/ong-gio-web
COPY frontend/ong-gio-web/package.json frontend/ong-gio-web/package-lock.json ./
RUN npm ci
COPY frontend/ong-gio-web/ ./
RUN npm run build

# Stage 2: Build backend (.NET 8)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend-build
WORKDIR /src

COPY src/OngGio.Domain/OngGio.Domain.csproj src/OngGio.Domain/
COPY src/OngGio.Application/OngGio.Application.csproj src/OngGio.Application/
COPY src/OngGio.Infrastructure/OngGio.Infrastructure.csproj src/OngGio.Infrastructure/
COPY src/OngGio.Api/OngGio.Api.csproj src/OngGio.Api/
RUN dotnet restore src/OngGio.Api/OngGio.Api.csproj

COPY src/ src/
COPY --from=frontend-build /src/frontend/ong-gio-web/dist/ src/OngGio.Api/wwwroot/

RUN dotnet publish src/OngGio.Api/OngGio.Api.csproj -c Release -o /app/publish --no-restore

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Render.com gán biến PORT; mặc định 8080 khi chạy local
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=backend-build /app/publish .
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
