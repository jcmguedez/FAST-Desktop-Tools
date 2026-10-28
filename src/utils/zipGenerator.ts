import JSZip from 'jszip'
import { BOILERPLATE_FILES } from '../data/boilerplateFiles'

export async function downloadBoilerplateZip(): Promise<void> {
  const zip = new JSZip()

  // Agregar todos los archivos al ZIP con sus rutas relativas exactas
  for (const file of BOILERPLATE_FILES) {
    zip.file(file.path, file.content)
  }

  // Agregar archivo README.md práctico
  const readmeContent = `# FAST Desktop Tool - Boilerplate

Estructura lista para producción construida con:
- **Electron** (Proceso Main y Preload seguro)
- **electron-vite** (Herramienta de empaquetado y HMR ultrarrápido)
- **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **better-sqlite3** (Base de datos local embebida y standalone en AppData/UserData)

## Instalación

1. Instalar dependencias:
\`\`\`bash
npm install
\`\`\`

2. Si trabajas en Windows/macOS/Linux y requieres compilar los binarios nativos C++ de \`better-sqlite3\` para Electron:
\`\`\`bash
npm run postinstall
# o directamente:
npx electron-builder install-app-deps
\`\`\`

## Ejecución en Desarrollo

\`\`\`bash
npm run dev
\`\`\`

## Compilación / Empaquetado para Producción

\`\`\`bash
# Empaquetar binario ejecutable para tu plataforma actual:
npm run build
\`\`\`
`
  zip.file('README.md', readmeContent)

  // Generar blob y forzar descarga
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'fast-desktop-tool-boilerplate.zip'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
