# Sistema de Gestión de Mantenimientos Programados 🏭

Sistema web integral para la administración, seguimiento y control de mantenimientos preventivos y correctivos de equipos industriales. Diseñado para optimizar la planificación de servicios y asegurar la disponibilidad operativa.

![Maintenance System Dashboard](https://via.placeholder.com/800x400?text=Dashboard+Preview)

## 📋 Características Principales

*   **Dashboard Interactivo**: Vista general del estado de los equipos, mantenimientos pendientes, urgentes y estadísticas en tiempo real.
*   **Gestión de Calendario**: Visualización mensual, semanal y diaria de las tareas programadas utilizando FullCalendar.
*   **Control de Equipos**: Inventario detallado con historial de servicios, manuales y especificaciones.
*   **Sistema de Alertas**: Notificaciones visuales para mantenimientos próximos a vencer o vencidos.
*   **Importación Masiva**: Carga de datos de equipos y programas de mantenimiento mediante archivos CSV.
*   **Historial y Auditoría**: Registro inmutable de acciones (logs) para trazabilidad completa.
*   **Autenticación Segura**: Sistema de login protegido con JWT (JSON Web Tokens).

## 🛠️ Tecnologías Utilizadas

### Backend
*   **Node.js & Express**: Servidor robusto y API RESTful.
*   **SQLite**: Base de datos ligera y eficiente (fácilmente migrable a PostgreSQL).
*   **JWT**: Autenticación segura y manejo de sesiones.
*   **Bcrypt**: Encriptación de contraseñas.

### Frontend
*   **HTML5 & CSS3**: Diseño moderno, responsivo y limpias interfaces de usuario.
*   **JavaScript (Vanilla)**: Lógica de cliente optimizada sin dependencias pesadas.
*   **FullCalendar**: Librería líder para gestión de eventos cronológicos.
*   **FontAwesome**: Iconografía intuitiva.

## 🚀 Instalación y Configuración

Siga estos pasos para desplegar el proyecto en un entorno local:

### 1. Prerrequisitos
*   Node.js (v14 o superior)
*   NPM (Gestor de paquetes de Node)

### 2. Clonar el Repositorio
```bash
git clone https://github.com/TU_USUARIO/sistema-mantenimientos.git
cd sistema-mantenimientos
```

### 3. Configuración del Backend
```bash
cd backend
npm install
```

Cree un archivo `.env` en la carpeta `backend` con la siguiente configuración:
```env
DB_TYPE=sqlite
DB_PATH=./mantenimientos.db
JWT_SECRET=tu_clave_secreta_segura
PORT=3001
NODE_ENV=development
```

### 4. Inicializar Base de Datos
Para crear las tablas y cargar datos de prueba:
```bash
node reset-database.js
```

### 5. Ejecutar la Aplicación
En la carpeta `backend`:
```bash
npm run dev
```
El servidor iniciará en `http://localhost:3001`.

### 6. Acceder al Frontend
Para desarrollo local sin un servidor web dedicado, puede abrir directamente el archivo:
`frontend/login.html` en su navegador o utilizar una extensión como "Live Server".

**Credenciales de Acceso (Demo):**
*   **Usuario:** admin@empresa.com
*   **Contraseña:** admin123

## 📂 Estructura del Proyecto

```
sistema-mantenimientos/
├── backend/                # Lógica del servidor y API
│   ├── config/            # Configuración de DB
│   ├── controllers/       # Controladores de rutas
│   ├── database/          # Scripts SQL y esquemas
│   ├── middleware/        # Middlewares (Auth, etc.)
│   ├── models/            # Modelos de datos
│   ├── routes/            # Definición de endpoints API
│   ├── server.js          # Punto de entrada del servidor
│   └── ...
├── frontend/              # Interfaz de usuario
│   ├── css/               # Estilos y temas
│   ├── js/                # Lógica de cliente (App, Auth)
│   ├── index.html         # Dashboard principal (SPA)
│   ├── login.html         # Página de acceso
│   └── ...
└── README.md              # Documentación del proyecto
```

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor, abra un issue primero para discutir qué le gustaría cambiar.

1.  Haga un Fork del proyecto
2.  Cree su rama de características (`git checkout -b feature/AmazingFeature`)
3.  Haga Commit de sus cambios (`git commit -m 'Add some AmazingFeature'`)
4.  Haga Push a la rama (`git push origin feature/AmazingFeature`)
5.  Abra un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - vea el archivo [LICENSE.md](LICENSE.md) para más detalles.

---
Desarrollado con ❤️ por [Tu Nombre/Empresa]
