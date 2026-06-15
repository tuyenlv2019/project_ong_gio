@echo off
chcp 65001 > nul 2>&1
set PGROOT=%~dp0
set PATH=%PGROOT%bin;%PATH%

echo === Khoi dong PostgreSQL ===
call "%PGROOT%PostgreSQL-Start.bat"

echo.
echo === Tao database ong_gio_db (neu chua co) ===
psql -U postgres -h localhost -p 5432 -tc "SELECT 1 FROM pg_database WHERE datname='ong_gio_db'" | findstr /C:"1" >nul
if errorlevel 1 (
    psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE ong_gio_db ENCODING 'UTF8';"
    echo Da tao database ong_gio_db
) else (
    echo Database ong_gio_db da ton tai
)

echo.
echo === Hoan tat. Chay API bang lenh: ===
echo cd d:\project_Ong_gio\src\OngGio.Api
echo dotnet run
pause
