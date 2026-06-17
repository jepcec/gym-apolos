# Apolos Gym Control - Documento de Implementación

## Resumen General

**Apolos Gym Control** es un sistema de gestión para gimnasios que permite administrar clientes, membresías, asistencias (check-ins), pagos y reportes. Está construido con:

- **Frontend:** Next.js 16 (App Router) con React 19, Tailwind CSS v4, TypeScript
- **Backend:** Go con framework Chi como router HTTP y SQLite como base de datos

El frontend se exporta como sitio estático (`output: 'export'`) y se comunica con el backend vía HTTP API RESTful en `http://127.0.0.1:{port}/api`.

---

## Frontend

### Páginas y Rutas

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/` | `app/page.tsx` | **Dashboard** - Muestra métricas clave (clientes activos, membresías por vencer, check-ins del día, ingresos mensuales, clientes nuevos). Incluye sección tabulada de estado de membresías (Por vencer, Vencidas, Activas, Sin membresía) con tabla de clientes buscable. Al hacer clic en una fila se copia el código del cliente al portapapeles. |
| `/login/` | `app/login/page.tsx` | **Login** - Formulario de usuario/contraseña. Pre-llena usuario "admin" y muestra hint de contraseña por defecto ("admin123"). Autentica vía `POST /api/login`, almacena token JWT en localStorage, redirige al dashboard. |
| `/clients/` | `app/clients/page.tsx` | **Lista de Clientes** - Tabla completa con búsqueda por nombre, código o DNI. Muestra badges de estado de membresía (Activa/Por vencer/Vencida/Sin membresía). Botones de acción: asignar membresía, renovar membresía, editar (placeholder), eliminar. Al hacer clic en una fila se abre ClientDetailModal. |
| `/clients/new/` | `app/clients/new/page.tsx` | **Nuevo Cliente** - Formulario con campos: nombre (requerido), DNI, teléfono, email, fecha de nacimiento, dirección. Tras crear exitosamente, muestra diálogo preguntando si se desea asignar una membresía inmediatamente. |
| `/memberships/` | `app/memberships/page.tsx` | **Membresías** - Dos secciones: (1) Tipos de membresía como grilla de tarjetas con botones editar/eliminar. (2) Tabla de membresías registradas mostrando cliente, plan, fechas, estado (badge) y precio. Formulario inline para crear nueva membresía (seleccionar cliente, plan, fecha inicio, precio). Abre MembershipTypeModal para crear/editar planes. |
| `/checkin/` | `app/checkin/page.tsx` | **Check-in** - Búsqueda por código de cliente. Muestra tarjeta con info del cliente y estado de membresía (verde=activa, rojo=vencida). Botón para registrar asistencia. Historial de check-ins agrupado por mes. Notificaciones toast para éxito/aviso/error. Maneja duplicados con mensaje de aviso. |
| `/reports/` | `app/reports/page.tsx` | **Reportes** - Cuatro tarjetas de descarga: Clientes, Membresías, Check-ins, Pagos. Cada una descarga un archivo CSV directamente desde el backend. |
| `/settings/` | `app/settings/page.tsx` | **Configuración** - Dos secciones: (1) Configuración general: días de inactividad umbral, días de aviso de membresía por vencer. (2) Cambio de contraseña (nota: simulado, no llama a un endpoint real). |

### Componentes

| Componente | Archivo | Líneas | Descripción |
|------------|---------|--------|-------------|
| **SidebarLayout** | `app/components/SidebarLayout.tsx` | 108 | Layout principal con sidebar fija de 264px. Navegación: Dashboard, Clientes, Membresías, Check-in, Reportes, Configuración. Incluye toggle de tema claro/oscuro y botón de cerrar sesión. Redirige a `/login/` si no hay autenticación. |
| **ClientDetailModal** | `app/components/ClientDetailModal.tsx` | 322 | Modal de detalle completo del cliente: datos personales (DNI, teléfono, email, último check-in), membresía actual con badge de estado, historial de membresías (últimas 5), historial de check-ins agrupado por mes con toggle "Mostrar más". Botones: Asignar Membresía, Renovar, Eliminar. |
| **MembershipTypeModal** | `app/components/MembershipTypeModal.tsx` | 178 | Modal para crear o editar un Tipo de Membresía (plan). Campos: nombre, duración en días, precio, descripción. Soporta modos crear (POST) y editar (PUT) según la prop `typeId`. |
| **MembershipModal** | `app/components/MembershipModal.tsx` | 276 | Modal para asignar o renovar una membresía a un cliente. En modo "asignar" permite seleccionar un plan. En modo "renovar" pre-llena con los datos de la membresía actual. Checkbox "Usar duración personalizada" para sobreescribir la duración del plan. Campos: selección de plan (o días custom), fecha inicio, precio. |

### Contextos (Estado Global)

| Contexto | Archivo | Descripción |
|----------|---------|-------------|
| **AuthProvider** | `app/context/auth.tsx` | Provee estado de autenticación. Almacena JWT token en `localStorage` bajo la clave `gym_token`. Expone `isAuthenticated` (booleano), `login(token)` (guarda token + actualiza estado), `logout()` (elimina token + limpia estado). Al montar, verifica si existe token en localStorage. |
| **ThemeProvider** | `app/context/theme.tsx` | Provee toggle de tema. Almacena preferencia en `localStorage` bajo clave `theme`. Expone `theme` (`'light' | 'dark'`) y `toggleTheme()`. Al montar, lee preferencia guardada y aplica la clase `dark` al `<html>`. |

**Jerarquía de providers** (en `layout.tsx`):
```
<ThemeProvider>
  <AuthProvider>
    {children}
  </AuthProvider>
</ThemeProvider>
```

### Librerías y Utilidades

| Utilidad | Archivo | Descripción |
|----------|---------|-------------|
| **apiFetch** | `app/lib/api.ts` | Cliente HTTP wrapper. Construye URL base usando `window.__BACKEND_PORT__` o puerto 8080 por defecto. Implementa lógica de reintentos (3 intentos con backoff exponencial: 500ms, 1000ms, 2000ms). Establece `Content-Type: application/json`. Lanza error en respuestas no-OK con mensajes parseados. |
| **login** | `app/lib/api.ts` | Función dedicada de login. Envía POST con username/password a `/api/login`. Retorna token en caso de éxito. |
| **global.d.ts** | `app/lib/global.d.ts` | Declaración TypeScript para `window.__BACKEND_PORT__`. |

### Estilos y Diseño

- **Framework:** Tailwind CSS v4 (plugin `@tailwindcss/postcss`, sintaxis `@import "tailwindcss"`)
- **Modo oscuro:** Implementado vía variante `dark:` de Tailwind. `ThemeProvider` togglea la clase `dark` en `<html>`. Todos los componentes tienen clases para ambos modos (ej: `bg-white dark:bg-zinc-800`, `text-zinc-900 dark:text-white`).
- **Variables CSS:** `globals.css` define `--background` y `--foreground` con valores distintos para light/dark.
- **Paleta de colores:** Zinc (zinc-50 a zinc-900) como base. Colores de acento para estados: verde (activo), amarillo/amber (por vencer), rojo (vencido/inactivo), azul (info), púrpura (clientes nuevos), esmeralda (ingresos).
- **Tipografía:** Fuentes Geist Sans y Geist Mono cargadas vía `next/font/google`.
- **Iconos:** Todos de `lucide-react` (sin SVGs custom).
- **Layout:** Sidebar fija (264px) + área de contenido scrolleable. Todas las páginas usan `SidebarLayout` como wrapper (excepto login).
- **Sin librería UI externa** - Todo el UI está construido manualmente con clases Tailwind.

### Formularios

| Formulario | Archivo | Campos |
|------------|---------|--------|
| **Login** | `app/login/page.tsx` | Usuario (pre-llenado "admin"), Contraseña |
| **Nuevo Cliente** | `app/clients/new/page.tsx` | Nombre* (requerido), DNI, Teléfono, Email, Fecha de nacimiento, Dirección |
| **Nueva Membresía (inline)** | `app/memberships/page.tsx` | Cliente (select), Plan (select), Fecha inicio, Precio |
| **Configuración** | `app/settings/page.tsx` | Días de inactividad, Días aviso vencimiento |
| **Cambio de Contraseña** | `app/settings/page.tsx` | Nueva contraseña, Confirmar contraseña |

### Tablas

| Tabla | Archivo | Columnas |
|-------|---------|----------|
| **Lista de Clientes** | `app/clients/page.tsx` | Código, Nombre, DNI, Teléfono, Membresía (badge), Vencimiento, Acciones |
| **Estado de Membresías (Dashboard)** | `app/page.tsx` | Código, Nombre, Teléfono, Tipo, Vencimiento |
| **Membresías Registradas** | `app/memberships/page.tsx` | Cliente, Plan, Inicio, Fin, Estado (badge), Precio |

### Modales

| Modal | Archivo | Propósito |
|-------|---------|-----------|
| **ClientDetailModal** | `app/components/ClientDetailModal.tsx` | Detalle completo: info personal, membresía actual, historial de membresías, historial de check-ins. Acciones: asignar, renovar, eliminar. |
| **MembershipTypeModal** | `app/components/MembershipTypeModal.tsx` | Crear o editar tipo/plan de membresía (nombre, duration_days, precio, descripción). |
| **MembershipModal** | `app/components/MembershipModal.tsx` | Asignar o renovar membresía para un cliente. Selección de plan o duración personalizada. |
| **Diálogo post-creación** | `app/clients/new/page.tsx` | Tras crear cliente, pregunta si desea asignar membresía inmediatamente. |
| **Toasts** | `app/checkin/page.tsx` | Notificaciones de éxito/aviso/error para operaciones de check-in. Auto-desaparecen a los 3 segundos. |

### Elementos Interactivos

- **Barra de búsqueda** en Clientes (filtra por nombre, código, DNI)
- **Barra de búsqueda** en Check-in (busca por código de cliente)
- **Navegación por tabs** en Dashboard de estado de membresías (Por vencer/Vencidas/Activas/Sin membresía)
- **Historial expandible** (mostrar más/menos) en Check-in y ClientDetailModal
- **Toggle de tema** en sidebar (iconos sol/luna)
- **Tarjetas de tipos de membresía** con botones editar/eliminar visibles al hover
- **Grilla de tarjetas** para planes de membresía en la página de Membresías

### Endpoints API Consumidos por el Frontend

| Método | Endpoint | Usado en | Propósito |
|--------|----------|----------|-----------|
| `POST` | `/api/login` | `login/page.tsx` vía `login()` | Autenticar usuario, recibir token |
| `GET` | `/api/dashboard` | `page.tsx` (Dashboard) | Obtener estadísticas agregadas |
| `GET` | `/api/clients` | `page.tsx`, `clients/page.tsx`, `memberships/page.tsx` | Listar todos los clientes |
| `POST` | `/api/clients` | `clients/new/page.tsx` | Crear nuevo cliente |
| `DELETE` | `/api/clients/:id` | `clients/page.tsx`, `ClientDetailModal.tsx` | Eliminar cliente |
| `GET` | `/api/clients/:id/memberships` | `page.tsx`, `clients/page.tsx`, `ClientDetailModal.tsx` | Obtener membresías de un cliente |
| `GET` | `/api/membership-types` | `memberships/page.tsx`, `MembershipTypeModal.tsx`, `MembershipModal.tsx` | Listar tipos de membresía |
| `POST` | `/api/membership-types` | `MembershipTypeModal.tsx` | Crear tipo de membresía |
| `PUT` | `/api/membership-types/:id` | `MembershipTypeModal.tsx` | Actualizar tipo de membresía |
| `DELETE` | `/api/membership-types/:id` | `memberships/page.tsx` | Eliminar tipo de membresía |
| `GET` | `/api/memberships` | `memberships/page.tsx` | Listar todas las membresías |
| `POST` | `/api/memberships` | `memberships/page.tsx`, `MembershipModal.tsx` | Crear membresía |
| `GET` | `/api/checkins/:code` | `checkin/page.tsx` | Buscar cliente por código para check-in |
| `POST` | `/api/checkins` | `checkin/page.tsx` | Registrar asistencia/check-in |
| `GET` | `/api/checkins?client_id=XX` | `checkin/page.tsx`, `ClientDetailModal.tsx` | Obtener historial de check-ins |
| `GET` | `/api/settings` | `settings/page.tsx`, `page.tsx`, `clients/page.tsx` | Obtener configuración del sistema |
| `PUT` | `/api/settings` | `settings/page.tsx` | Actualizar configuración del sistema |
| `GET` | `/api/reports/:type` | `reports/page.tsx` vía `window.open()` | Descargar reportes CSV |

---

## Backend

### Endpoints API

Todos los endpoints están montados bajo `/api` definido en `main.go`.

#### Autenticación

| Método | Endpoint | Handler | Descripción |
|--------|----------|---------|-------------|
| `POST` | `/api/login` | `handleLogin` | Autentica usuario admin; compara contraseña con hash bcrypt; retorna token basado en timestamp (`gym-token-YYYYMMDDHHmmss`) |

#### Clientes

| Método | Endpoint | Handler | Descripción |
|--------|----------|---------|-------------|
| `GET` | `/api/clients` | `listClients` | Lista todos los clientes ordenados por fecha de creación descendente |
| `POST` | `/api/clients` | `createClient` | Crea nuevo cliente; auto-genera código único (`GYM-001`, `GYM-002`, ...); valida que `name` no esté vacío |
| `GET` | `/api/clients/:id` | `getClient` | Obtiene un cliente por ID |
| `PUT` | `/api/clients/:id` | `updateClient` | Actualiza campos del cliente (name, dni, phone, email, birth_date, address, status) |
| `DELETE` | `/api/clients/:id` | `deleteClient` | Elimina un cliente por ID (hard delete) |
| `GET` | `/api/clients/code/:code` | `getClientByCode` | Busca cliente por su código (ej: `GYM-001`) |
| `GET` | `/api/clients/:id/memberships` | `getClientMemberships` | Obtiene todas las membresías de un cliente con información del tipo de membresía incluida |

#### Tipos de Membresía

| Método | Endpoint | Handler | Descripción |
|--------|----------|---------|-------------|
| `GET` | `/api/membership-types` | `listMembershipTypes` | Lista todos los planes/tipos de membresía |
| `POST` | `/api/membership-types` | `createMembershipType` | Crea nuevo tipo de membresía (name, duration_days, price, description) |
| `PUT` | `/api/membership-types/:id` | `updateMembershipType` | Actualiza un tipo de membresía |
| `DELETE` | `/api/membership-types/:id` | `deleteMembershipType` | Elimina un tipo de membresía (hard delete) |

#### Membresías

| Método | Endpoint | Handler | Descripción |
|--------|----------|---------|-------------|
| `GET` | `/api/memberships` | `listMemberships` | Lista membresías; filtro opcional `?client_id=`; incluye datos de cliente y tipo |
| `POST` | `/api/memberships` | `createMembership` | Crea membresía; calcula `end_date` desde `start_date + duration_days`; soporta duración personalizada (`duration_days > 0` con `type_id=0`) |
| `PUT` | `/api/memberships/:id` | `updateMembership` | Actualiza estado y precio de membresía |

#### Check-ins

| Método | Endpoint | Handler | Descripción |
|--------|----------|---------|-------------|
| `POST` | `/api/checkins` | `createCheckin` | Registra check-in; **previene duplicados en el mismo día** (409 Conflict); actualiza `clients.last_checkin` |
| `GET` | `/api/checkins` | `listCheckins` | Lista check-ins; filtro opcional `?client_id=`; incluye datos del cliente; limitado a 100 resultados, ordenados por fecha descendente |
| `GET` | `/api/checkins/:code` | `getCheckinInfo` | Busca cliente por código y retorna info del cliente + membresía activa |

#### Pagos

| Método | Endpoint | Handler | Descripción |
|--------|----------|---------|-------------|
| `POST` | `/api/payments` | `createPayment` | Registra pago vinculado a una membresía; fecha default hoy si no se proporciona |
| `GET` | `/api/payments` | `listPayments` | Lista pagos; filtro opcional `?membership_id=` |

#### Reportes

| Método | Endpoint | Handler | Descripción |
|--------|----------|---------|-------------|
| `GET` | `/api/reports/clients` | `generateClientsReport` | Genera descarga CSV de todos los clientes |
| `GET` | `/api/reports/memberships` | `generateMembershipsReport` | Genera descarga CSV de todas las membresías con datos de cliente/tipo |
| `GET` | `/api/reports/checkins?month=YYYY-MM` | `generateCheckinsReport` | Genera CSV de check-ins filtrados por mes (default: mes actual) |
| `GET` | `/api/reports/payments?month=YYYY-MM` | `generatePaymentsReport` | Genera CSV de pagos filtrados por mes (default: mes actual) |

#### Dashboard

| Método | Endpoint | Handler | Descripción |
|--------|----------|---------|-------------|
| `GET` | `/api/dashboard` | `getDashboardStats` | Retorna estadísticas: clientes activos, membresías por vencer, check-ins de hoy, ingresos mensuales, clientes nuevos del mes |
| `GET` | `/api/dashboard/members-by-status` | `getMembersByStatus` | Retorna clientes categorizados en buckets: `expiring_soon`, `expired`, `active`, `no_membership` |

#### Configuración

| Método | Endpoint | Handler | Descripción |
|--------|----------|---------|-------------|
| `GET` | `/api/settings` | `getSettings` | Retorna todas las configuraciones como mapa clave-valor |
| `PUT` | `/api/settings` | `updateSettings` | Actualiza configuraciones usando upsert (`ON CONFLICT(key) DO UPDATE`) |

#### Health Check

| Método | Endpoint | Handler | Descripción |
|--------|----------|---------|-------------|
| `GET` | `/api/health` | inline | Retorna `{"ok":true}` para monitoreo |

### Modelos de Datos

**Archivo:** `backend/models/models.go`

| Struct | Campos | Descripción |
|--------|--------|-------------|
| `User` | `ID`, `Username`, `PasswordHash`, `CreatedAt` | Usuario admin (único, sin roles) |
| `Client` | `ID`, `Code`, `Name`, `DNI`, `Phone`, `Email`, `BirthDate`, `Address`, `Status`, `LastCheckin`, `CreatedAt`, `UpdatedAt` | Miembro/cliente del gimnasio |
| `MembershipType` | `ID`, `Name`, `DurationDays`, `Price`, `Description`, `CreatedAt` | Plantilla de plan configurable |
| `Membership` | `ID`, `ClientID`, `TypeID`, `StartDate`, `EndDate`, `Status`, `Price`, `CreatedAt`, `Client*`, `Type*`, `DurationDays` | Membresía activa/expirada de un cliente |
| `Payment` | `ID`, `MembershipID`, `Amount`, `PaymentMethod`, `PaymentDate`, `Note`, `CreatedAt` | Registro de pago vinculado a membresía |
| `Checkin` | `ID`, `ClientID`, `CheckinDate`, `CreatedAt`, `Client*` | Registro de asistencia |
| `Setting` | `ID`, `Key`, `Value`, `UpdatedAt` | Configuración del sistema (clave-valor) |
| `DashboardStats` | `ActiveClients`, `ExpiringMemberships`, `TodayCheckins`, `MonthlyIncome`, `NewClientsThisMonth` | Respuesta de estadísticas del dashboard |
| `LoginRequest` | `Username`, `Password` | DTO de solicitud de autenticación |
| `LoginResponse` | `Success`, `Token`, `Error` | DTO de respuesta de autenticación |

### Esquema de Base de Datos (SQLite)

**Archivo:** `backend/database/db.go`

| Tabla | Columnas | Notas |
|-------|----------|-------|
| `users` | `id` (PK), `username` (UNIQUE), `password_hash`, `created_at` | Seed con admin default (`admin` / bcrypt hash de `admin123`) |
| `clients` | `id` (PK), `code` (UNIQUE), `name`, `dni`, `phone`, `email`, `birth_date`, `address`, `status` (default `'active'`), `last_checkin`, `created_at`, `updated_at` | Código auto-generado formato `GYM-XXX` |
| `membership_types` | `id` (PK), `name`, `duration_days`, `price`, `description`, `created_at` | Seed con 4 planes: Mensual(30d/$50), Trimestral(90d/$135), Semestral(180d/$255), Anual(365d/$480) |
| `memberships` | `id` (PK), `client_id` (FK->clients), `type_id` (FK->membership_types), `start_date`, `end_date`, `status` (default `'active'`), `price`, `created_at` | |
| `payments` | `id` (PK), `membership_id` (FK->memberships), `amount`, `payment_method`, `payment_date`, `note`, `created_at` | |
| `checkins` | `id` (PK), `client_id` (FK->clients), `checkin_date`, `created_at` | |
| `settings` | `id` (PK), `key` (UNIQUE), `value`, `updated_at` | Seed con: `inactivity_days=30`, `data_dir=""`, `backup_dir=""` |

La base de datos se almacena en `~/.gym-control/gym.db` (configurable vía `GYM_DATA_DIR`).

### Autenticación

- **Mecanismo:** Login con usuario/contraseña
- **Hash de contraseñas:** bcrypt (`golang.org/x/crypto/bcrypt`)
- **Credenciales default:** usuario `admin`, contraseña `admin123` (seed en inicialización de DB)
- **Token:** String simple `"gym-token-" + timestamp` (NO es JWT; sin firma, sin verificación de expiración)
- **Sin middleware de protección:** No hay validación de token en requests subsecuentes. Todos los endpoints `/api/*` son públicamente accesibles sin autenticación.

### Middleware

| Middleware | Fuente | Descripción |
|-----------|--------|-------------|
| CORS | `github.com/go-chi/cors` | Permite todos los orígenes (`*`), métodos (GET, POST, PUT, DELETE, OPTIONS) y headers |
| Logger | `chi/middleware.Logger` | Logging de requests HTTP |
| Recoverer | `chi/middleware.Recoverer` | Recuperación de panics para prevenir crashes del servidor |

### Lógica de Negocio

#### Generación de Código de Cliente
- Archivo: `backend/api/clients.go`, función `generateClientCode()`
- Formato: `GYM-001` hasta `GYM-999`
- Auto-incrementa basándose en el sufijo numérico más alto existente

#### Prevención de Check-ins Duplicados
- Archivo: `backend/api/checkins.go`, función `createCheckin()`
- Consulta si existe check-in del mismo cliente en la misma fecha
- Retorna HTTP 409 Conflict si ya existe un check-in

#### Cálculo de Fecha de Fin de Membresía
- Archivo: `backend/api/memberships.go`, función `createMembership()`
- Dos modos: (a) vinculada a tipo de membresía (auto-calcula end_date desde duration_days del tipo), o (b) duración personalizada (duration_days enviado directamente, type_id = 0)

#### Helpers de Estado de Membresía
- `getActiveMembership(clientID)`: Retorna la membresía activa más reciente de un cliente
- `isMembershipExpired(endDate)`: Verifica si la fecha ya pasó
- `isMembershipExpiringSoon(endDate)`: Verifica si la fecha de fin está dentro de 7 días

#### Estadísticas del Dashboard
- Clientes activos: `SELECT COUNT(*) FROM clients WHERE status = 'active'`
- Membresías por vencer: miembros con end_date en los próximos 7 días
- Check-ins de hoy: conteo de checkins con fecha de hoy
- Ingresos mensuales: `SUM(amount)` de pagos desde inicio del mes
- Clientes nuevos este mes: conteo de clientes creados desde inicio del mes

#### Categorización de Estado de Miembros
- Clasifica todos los clientes activos en 4 buckets: `expiring_soon`, `expired`, `active`, `no_membership`
- Usa JOIN con memberships y membership_types

#### Backup de Base de Datos
- Archivo: `backend/database/db.go`, función `Backup()`
- Copia simple del archivo SQLite a un directorio de backup
- El nombre del backup usa el PID del proceso (no timestamp)

### Validaciones

No se utiliza una librería de validación formal. Las validaciones son manuales en los handlers:

| Archivo | Validación |
|---------|-----------|
| `clients.go` | `name` no debe estar vacío (trim de espacios) |
| `memberships.go` | Valida que `type_id` exista en `membership_types` si no se proporciona duración personalizada |
| `checkins.go` | Previene check-ins duplicados por cliente por día |
| `auth.go` | Retorna 401 para credenciales inválidas |
| Todos los handlers | Retorna 400 para bodies JSON malformados |

### Dependencias del Backend

| Dependencia | Propósito |
|-------------|-----------|
| `github.com/go-chi/chi/v5` | Router HTTP |
| `github.com/go-chi/cors` | Middleware CORS |
| `golang.org/x/crypto` | Hash bcrypt de contraseñas |
| `modernc.org/sqlite` | Driver SQLite puro en Go (sin CGO) |

---

## Observaciones y Funcionalidades Pendientes

### Funcionalidades No Implementadas o Incompletas

1. **Edición de clientes** - El botón editar (icono lápiz) existe en la lista de clientes pero no tiene handler `onClick` implementado. No existe ruta `/clients/edit/[id]`. El endpoint `PUT /api/clients/:id` existe en el backend pero no es consumido por el frontend.

2. **Página de Pagos** - El backend tiene endpoints `/api/payments` pero no existe UI dedicada para pagos. Los pagos solo son descargables vía el reporte CSV.

3. **Token de autenticación no enviado en requests** - `apiFetch()` no incluye header `Authorization` con el token almacenado. El token se guarda tras el login pero nunca se usa para requests autenticados.

4. **Cambio de contraseña simulado** - El formulario de cambio de contraseña en Configuración no llama a ningún endpoint API; solo muestra un mensaje de éxito.

5. **Backup automático no implementado** - La función `database.Backup()` está definida pero nunca es llamada desde ningún lugar del código.

6. **URL hardcodeada en Reportes** - La página de reportes usa `http://localhost:8080/api/reports/:type` directamente en vez de `apiFetch`, lo cual ignora el puerto dinámico detectado por Tauri.

7. **Handler de pago no registrado** - La función `getPayment` existe en `payments.go` pero no está registrada como ruta (código muerto).

8. **Carga secuencial de membresías en Dashboard** - El dashboard obtiene las membresías de cada cliente en un loop `for` secuencial, lo cual puede ser lento con muchos clientes.

9. **El token no es un JWT** - El token generado es `gym-token-{timestamp}`, sin firma ni verificación de expiración. La seguridad de la autenticación es puramente del lado del cliente.

10. **Sin pruebas** - No se encontraron archivos de prueba (tests) en el frontend ni en el backend.

11. **Sin integraciones externas** - No hay servicios de email, SMS, notificaciones, pasarelas de pago, ni APIs de terceros.

12. **Reportes solo en CSV** - Solo existe exportación CSV.

13. **Servidor solo en localhost** - El servidor se configura para escuchar solo en `127.0.0.1` (sin acceso remoto), apropiado para una aplicación desktop.
