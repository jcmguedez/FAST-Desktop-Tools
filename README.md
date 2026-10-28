# FAST Desktop Tool: Asistente de Análisis de Sistemas 🚀

**FAST Desktop Tool** es una aplicación de escritorio (stand-alone) de código abierto, diseñada para guiar a estudiantes, analistas y desarrolladores paso a paso en la aplicación de la metodología **FAST** (Framework for the Application of Systems Thinking) propuesta por Whitten, Bentley y Barlow.

El objetivo es automatizar la tediosa tarea de documentación, generar diagramas (ERD, DFD, DCP) de forma automática y garantizar que los proyectos de software sigan un estándar de calidad académico y profesional, **sin necesidad de conexión a internet ni servidores costosos**.

## ✨ Características Principales

*   **100% Stand-Alone:** Tus datos viven en tu computadora. Cero dependencias de la nube. Cero costos de servidores.
*   **Privacidad Absoluta:** Ideal para consultores y empresas que manejan información confidencial de sus clientes.
*   **Asistente Guiado:** Un "Wizard" interactivo que te lleva por las fases de **Inspección, Estudio y Definición**.
*   **Generación Automática de Diagramas:** Integración nativa con `Mermaid.js` para crear Modelos Entidad-Relación (DER), Diagramas de Flujo de Datos (DFD) y Diagramas de Conexión de Puestos (DCP) escribiendo simples formularios.
*   **Diccionario de Proyectos Automatizado:** Genera el diccionario de datos y procesos en formato Markdown o PDF con un solo clic.
*   **Multi-proyecto:** Gestiona todos tus clientes y proyectos desde un solo panel.

## 🛠️ Stack Tecnológico

Este proyecto está construido con herramientas modernas y 100% Open Source:

*   **Entorno de Escritorio:** [Electron](https://www.electronjs.org/) (Empaqueta la app para Windows, Mac y Linux).
*   **Frontend:** [React 18](https://reactjs.org/) + [Tailwind CSS](https://tailwindcss.com/) (Interfaz moderna y ágil).
*   **Backend:** [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/).
*   **Base de Datos:** [SQLite](https://www.sqlite.org/) (Base de datos relacional local, sin configuración).
*   **Diagramación:** [Mermaid.js](https://mermaid.js.org/) (Renderizado de diagramas basado en texto).

## 🚀 ¿Cómo empezar? (Para Desarrolladores)

Si quieres probar la herramienta en tu entorno local o contribuir al desarrollo:

### Prerrequisitos
*   Node.js (v18 o superior)
*   Git

### Instalación
1.  Clona este repositorio:
    ```bash
    git clone https://github.com/tu-usuario/fast-desktop-tool.git
