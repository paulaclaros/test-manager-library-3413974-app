# Manager Library — Frontend Web (React 18 + TypeScript + Vite)

> **Evaluación Técnica · Ficha ADSO 3413974 · SENA**  
> Interfaz gráfica de usuario para la biblioteca *Manager Library*, construida en React 18 con TypeScript y empaquetada con Nginx.

---

## 💻 1. Módulos Implementados

* **Autenticación (HU-01):** Inicio de sesión con JWT y control de acceso basado en roles (`admin` y `librarian`).
* **Catálogo de Libros (HU-03 y HU-04):** Búsqueda en vivo por texto y categoría (5 categorías fijas), estado de copias disponibles y totales, alta y baja lógica para administradores.
* **Directorio de Socios (HU-05):** Registro de socios con validación de documento único y visualización de libros activos.
* **Préstamos (HU-06):** Selección de socio y de 1 a 3 libros disponibles con cálculo atómico de fecha límite (14 días).
* **Devoluciones (HU-07):** Devolución por línea con reintegración automática del stock disponible y cálculo reactivo del estado del préstamo (`open`, `overdue`, `closed`).
* **Libros Vencidos (HU-09):** Bandeja operativa de alerta con cálculo en tiempo real de días de retraso (`days_late`).
* **Reporte de Libros Más Prestados (HU-10):** Consulta histórica agregada por fecha y datos congelados (ADR-004), exclusiva para administradores.
* **Gestión de Personal (HU-02):** Creación de cuentas para nuevos bibliotecarios.

---

## 🛠️ 2. Ejecución Local en Desarrollo

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Compilar para producción
npm run build
```

---

## 🐳 3. Despliegue con Docker

El frontend se compila en dos etapas (*multi-stage build*) con Node 20 y se sirve con **Nginx 1.27 Alpine**, aplicando un proxy inverso transparente hacia la API en Laravel en `/api/` y `/health`.
