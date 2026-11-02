# 🏋️ Forja Gym

Aplicación de escritorio para la gestión integral de gimnasios, desarrollada con **Electron + Next.js** y distribuida como un ejecutable para Windows. Permite administrar clientes, membresías, pagos y asistencias desde una interfaz moderna, con almacenamiento local mediante SQLite.

## ✨ Características

- 👤 Gestión de clientes (CRUD)
- 🆔 DNI como código de verificación (único y obligatorio)
- 💳 Administración de membresías
- 📅 Control de fechas de vigencia y estados
- ✅ Registro diario de check-ins
- 💰 Gestión de pagos
- 📊 Dashboard con métricas en tiempo real
- 📄 Exportación de reportes en CSV
- 💾 Backups automáticos y manuales
- 🌙 Tema claro/oscuro
- 🖥️ Instalador para Windows (.exe)

---

## 🛠️ Tecnologías

| Capa | Tecnologías |
|------|-------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend | Next.js API Routes, Prisma ORM |
| Base de datos | SQLite + LibSQL |
| Escritorio | Electron, Electron Builder |
| Iconos | Lucide React |

---

## 🏛️ Arquitectura

La aplicación sigue una arquitectura **full-stack integrada**.

- **Electron** ejecuta la aplicación de escritorio.
- **Next.js** funciona como servidor local embebido.
- **Prisma ORM** administra el acceso a la base de datos SQLite.
- La comunicación con el sistema operativo se realiza mediante **IPC seguro** utilizando `contextIsolation`.

```
Electron
    │
    ▼
Next.js (Servidor Local)
    │
API Routes
    │
Prisma ORM
    │
SQLite
```

---

## 📦 Funcionalidades

### Clientes

- Registro y edición
- Eliminación
- Búsqueda
- Filtros
- DNI único y obligatorio, usado como código de verificación

### Membresías

- Mensual
- Trimestral
- Semestral
- Anual

Estados automáticos:

- Activa
- Por vencer
- Vencida

### Check-ins

- Registro diario
- Prevención de duplicados

### Pagos

- Historial
- Asociación con membresías

### Dashboard

- Clientes activos
- Membresías por vencer
- Check-ins del día
- Ingresos mensuales

### Reportes

Exportación a CSV de:

- Clientes
- Membresías
- Pagos
- Check-ins

### Backups

- Respaldo manual
- Respaldo automático
- Restauración de información

---

## 🚀 Instalación

Clonar el repositorio

```bash
git clone https://github.com/usuario/forja-gym-control.git
cd forja-gym-control
```

Instalar dependencias

```bash
npm install
```

Generar la base de datos

```bash
npx prisma generate
npx prisma migrate dev
```

Ejecutar en desarrollo

```bash
npm run dev
```

---

## 📦 Compilar para Windows

```bash
npm run electron:build
```

El proceso realiza:

1. Build de Next.js
2. Generación del servidor standalone
3. Preparación de Electron
4. Empaquetado con Electron Builder
5. Generación del instalador `.exe`

El instalador no requiere Node.js ni un `node.exe` adicional. Electron utiliza
su propio runtime de Node para ejecutar el servidor standalone de Next.js.

El instalador generado queda en `dist-electron/`.

### Generación automática con GitHub Actions

El workflow `.github/workflows/build-electron.yml` genera el instalador para
Windows cuando se ejecuta manualmente desde Actions o cuando se publica un tag
con formato `v*`, por ejemplo:

```bash
git tag v0.1.0
git push origin v0.1.0
```

En ambos casos el `.exe` queda disponible como artefacto. Al publicar un tag,
además se crea una GitHub Release automáticamente.

---

## 📁 Estructura del proyecto

```
app/
components/
electron/
lib/
prisma/
public/
scripts/
```

---

## 🎯 Objetivos del proyecto

- Centralizar la gestión administrativa de gimnasios.
- Facilitar el control de membresías y pagos.
- Ofrecer una solución de escritorio rápida y sencilla.
- Funcionar completamente de forma local sin depender de servidores externos.

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo `LICENSE` para más información.
