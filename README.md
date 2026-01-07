# Roadmap Planner

## Descripción

**Roadmap Planner** es una aplicación web diseñada para la gestión y visualización de hojas de ruta de productos. Permite a los usuarios planificar, organizar y seguir el progreso de múltiples productos de una manera intuitiva y visual, con vistas de lista y calendario, potentes filtros y un dashboard de estadísticas.

La aplicación está construida como una Single-Page Application (SPA) utilizando tecnologías modernas, con un enfoque en la interactividad y la experiencia de usuario. Todos los datos se gestionan localmente en el navegador a través de `localStorage`, lo que la hace rápida y funcional sin necesidad de una base de datos externa para esta versión demo.

---

## ✨ Features

- **Gestión Completa de Productos (CRUD):**

  - **Crear:** Añadir nuevos productos con detalles como nombre, operador, país, fechas, URLs, e hitos.
  - **Leer:** Visualizar productos en una vista de lista o calendario.
  - **Actualizar:** Editar cualquier detalle de un producto existente.
  - **Eliminar:** Borrar productos de forma segura.

- **Vistas Duales:**

  - **Vista de Lista:** Una vista agrupada por año y trimestre que muestra los productos en tarjetas detalladas.
  - **Vista de Calendario:** Un calendario mensual que visualiza la duración de los proyectos y los días festivos, facilitando la planificación a largo plazo.

- **Filtrado y Ordenamiento Avanzado:**

  - Filtra productos por término de búsqueda, estado, operador, país, idioma, año y trimestre.
  - Ordena la lista de productos por fecha de inicio o nombre (ascendente/descendente).

- **Dashboard de Estadísticas:**

  - Un panel visual con métricas clave sobre los productos filtrados.
  - Gráficos de torta y barras que muestran la distribución de productos por país y estado.

- **Gestión de Feriados:**

  - Añade, edita o elimina feriados que se reflejan automáticamente en la vista de calendario.

- **Autenticación y Perfil de Usuario:**

  - Sistema de inicio de sesión (simulado con datos mock).
  - Página de perfil donde el usuario puede actualizar su nombre y avatar.

- **Diseño Responsivo:**
  - Interfaz completamente adaptada para funcionar de manera óptima en dispositivos de escritorio, tabletas y móviles.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (con App Router)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **UI:** [React](https://react.dev/)
- **Componentes UI:** [ShadCN/UI](https://ui.shadcn.com/)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
- **Gestión de Formularios:** [React Hook Form](https://react-hook-form.com/) con [Zod](https://zod.dev/) para validación.
- **Manejo de Fechas:** [date-fns](https://date-fns.org/)
- **Gráficos:** [Recharts](https://recharts.org/)
- **Iconos:** [Lucide React](https://lucide.dev/)
- **Animaciones:** [Framer Motion](https://www.framer.com/motion/)

---

## 👨‍💻 Diseño y Desarrollo

Esta aplicación fue diseñada y desarrollada por **Marco Tortolani**.
