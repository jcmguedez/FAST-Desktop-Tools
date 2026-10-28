import { useState } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Database, 
  Layers, 
  Workflow, 
  Users,
  CheckCircle2
} from 'lucide-react';
import { Entidad } from './GestionEntidades';

interface Proceso {
  id: number;
  proyecto_id: number;
  nombre: string;
  descripcion: string | null;
  numero_proceso: string;
}

interface FlujoDato {
  id: number;
  descripcion: string;
  proceso_origen_id: number | null;
  proceso_destino_id: number | null;
  entidad_id: number | null;
  proceso_origen_nombre?: string;
  proceso_origen_num?: string;
  proceso_destino_nombre?: string;
  proceso_destino_num?: string;
  entidad_nombre?: string;
}

interface Puesto {
  id: number;
  proyecto_id: number;
  nombre: string;
  descripcion: string | null;
}

interface ConexionPuesto {
  id: number;
  tipo_conexion: string;
  puesto_origen_id: number;
  puesto_destino_id: number;
  puesto_origen_nombre?: string;
  puesto_destino_nombre?: string;
}

interface Fase {
  id: number;
  proyecto_id: number;
  tipo_fase: string;
  estado: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

interface DiccionarioDatosProps {
  proyecto: {
    id: number;
    nombre: string;
    cliente: string;
    fecha_creacion: string;
  };
  fases: Fase[];
  entidades: Entidad[];
  procesos: Proceso[];
  flujos: FlujoDato[];
  puestos: Puesto[];
  conexiones: ConexionPuesto[];
}

export default function DiccionarioDatos({
  proyecto,
  fases,
  entidades,
  procesos,
  flujos,
  puestos,
  conexiones
}: DiccionarioDatosProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');

  // Generar contenido en Markdown estructurado
  const generateMarkdown = (): string => {
    let md = `# Diccionario de Datos y Especificación Metodológica FAST\n\n`;
    md += `**Proyecto:** ${proyecto.nombre}\n`;
    md += `**Cliente / Organización:** ${proyecto.cliente}\n`;
    md += `**Fecha de Creación:** ${proyecto.fecha_creacion}\n`;
    md += `**Metodología:** Framework for the Application of Systems Thinking (FAST - Whitten, Bentley & Barlow)\n\n`;
    md += `---\n\n`;

    // 1. Fases del Proyecto
    md += `## 1. Fases del Ciclo de Vida FAST\n\n`;
    if (fases.length > 0) {
      md += `| Fase | Estado | Fecha Inicio | Fecha Fin |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      fases.forEach((f) => {
        md += `| ${f.tipo_fase} | ${f.estado} | ${f.fecha_inicio || 'N/A'} | ${f.fecha_fin || 'N/A'} |\n`;
      });
      md += `\n`;
    } else {
      md += `*Sin fases registradas.*\n\n`;
    }

    // 2. Diccionario de Datos (Entidades y Atributos)
    md += `## 2. Diccionario de Datos (Modelo Entidad-Relación)\n\n`;
    if (entidades.length > 0) {
      entidades.forEach((ent, index) => {
        md += `### 2.${index + 1}. Entidad: \`${ent.nombre}\`\n\n`;
        if (ent.descripcion) {
          md += `> **Descripción:** ${ent.descripcion}\n\n`;
        }
        md += `| Nombre Atributo | Tipo de Dato | Clave Primaria (PK) |\n`;
        md += `| :--- | :--- | :--- |\n`;
        if (ent.atributos && ent.atributos.length > 0) {
          ent.atributos.forEach((at) => {
            md += `| \`${at.nombre}\` | ${at.tipo_dato} | ${at.es_clave_primaria ? 'Sí (PK)' : 'No'} |\n`;
          });
        } else {
          md += `| *Sin atributos definidos* | - | - |\n`;
        }
        md += `\n`;
      });
    } else {
      md += `*Sin entidades registradas.*\n\n`;
    }

    // 3. Catálogo de Procesos (DFD)
    md += `## 3. Catálogo de Procesos y Flujos de Datos (DFD)\n\n`;
    if (procesos.length > 0) {
      md += `| Nº Proceso | Nombre del Proceso | Lógica / Descripción |\n`;
      md += `| :--- | :--- | :--- |\n`;
      procesos.forEach((p) => {
        md += `| \`${p.numero_proceso}\` | **${p.nombre}** | ${p.descripcion || 'Sin descripción'} |\n`;
      });
      md += `\n`;
    }

    if (flujos.length > 0) {
      md += `### 3.1. Flujos de Datos Interconectados\n\n`;
      md += `| Origen | Destino | Información / Flujo |\n`;
      md += `| :--- | :--- | :--- |\n`;
      flujos.forEach((flujo) => {
        const origen = flujo.proceso_origen_nombre 
          ? `Proceso ${flujo.proceso_origen_num}: ${flujo.proceso_origen_nombre}` 
          : 'Entidad Externa';
        const destino = flujo.proceso_destino_nombre 
          ? `Proceso ${flujo.proceso_destino_num}: ${flujo.proceso_destino_nombre}` 
          : 'Almacén de Datos';
        md += `| ${origen} | ${destino} | **${flujo.descripcion}** |\n`;
      });
      md += `\n`;
    }

    // 4. Diagrama de Conexión de Puestos (DCP)
    md += `## 4. Estructura de Puestos y Canales de Comunicación (DCP)\n\n`;
    if (puestos.length > 0) {
      md += `### 4.1. Puestos de la Organización\n\n`;
      puestos.forEach((p) => {
        md += `- **${p.nombre}:** ${p.descripcion || 'Sin descripción detallada.'}\n`;
      });
      md += `\n`;
    }

    if (conexiones.length > 0) {
      md += `### 4.2. Canales de Enlace entre Puestos\n\n`;
      md += `| Puesto Origen | Puesto Destino | Tipo de Canal / Conexión |\n`;
      md += `| :--- | :--- | :--- |\n`;
      conexiones.forEach((c) => {
        md += `| ${c.puesto_origen_nombre} | ${c.puesto_destino_nombre} | ${c.tipo_conexion} |\n`;
      });
      md += `\n`;
    }

    md += `---\n*Documento generado automáticamente por FAST Desktop Tool.*\n`;
    return md;
  };

  const markdownContent = generateMarkdown();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diccionario-fast-${proyecto.nombre.toLowerCase().replace(/\\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Barra superior de acciones */}
      <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Diccionario de Datos y Especificación FAST
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Generación automatizada de documentación técnica para el proyecto "{proyecto.nombre}".
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Vista Previa / Código Markdown */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                viewMode === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Documento Renderizado
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                viewMode === 'raw' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Markdown (.md)
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copiar</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar .MD</span>
          </button>
        </div>
      </div>

      {/* Contenido */}
      {viewMode === 'preview' ? (
        <div className="p-8 space-y-8 max-w-4xl mx-auto text-slate-200 text-xs">
          {/* Encabezado formal */}
          <div className="border-b border-slate-800 pb-6">
            <div className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest mb-1">
              DOCUMENTACIÓN FORMAL DE SISTEMAS
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">{proyecto.nombre}</h1>
            <div className="flex flex-wrap gap-4 text-slate-400 text-xs">
              <div>Cliente: <strong className="text-slate-200">{proyecto.cliente}</strong></div>
              <div>·</div>
              <div>Fecha: <strong className="text-slate-200">{proyecto.fecha_creacion}</strong></div>
              <div>·</div>
              <div>Metodología: <strong className="text-indigo-300">FAST (Whitten, Bentley & Barlow)</strong></div>
            </div>
          </div>

          {/* 1. Fases FAST */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              1. Ciclo de Vida Metodológico FAST
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium">
                    <th className="py-2 px-3">Fase</th>
                    <th className="py-2 px-3">Estado</th>
                    <th className="py-2 px-3">Inicio</th>
                    <th className="py-2 px-3">Fin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {fases.map((f) => (
                    <tr key={f.id}>
                      <td className="py-2 px-3 font-sans font-medium text-slate-200">{f.tipo_fase}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                          {f.estado}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400">{f.fecha_inicio || '—'}</td>
                      <td className="py-2 px-3 text-slate-400">{f.fecha_fin || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 2. Diccionario de Datos */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-2">
              <Database className="w-4 h-4 text-indigo-400" />
              2. Diccionario de Datos (Modelo ERD / DER)
            </h3>
            <div className="space-y-4">
              {entidades.map((ent, idx) => (
                <div key={ent.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-baseline justify-between mb-2">
                    <h4 className="text-xs font-bold text-indigo-300 font-mono">
                      2.{idx + 1}. Entidad: {ent.nombre}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">ID #{ent.id}</span>
                  </div>
                  {ent.descripcion && (
                    <p className="text-[11px] text-slate-400 mb-3 italic">
                      "{ent.descripcion}"
                    </p>
                  )}
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-slate-500">
                        <th className="py-1 px-2 font-medium">Atributo</th>
                        <th className="py-1 px-2 font-medium">Tipo de Dato</th>
                        <th className="py-1 px-2 font-medium">Clave</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {ent.atributos && ent.atributos.length > 0 ? (
                        ent.atributos.map((at) => (
                          <tr key={at.id}>
                            <td className={`py-1 px-2 ${at.es_clave_primaria ? 'text-amber-300 font-bold' : 'text-slate-300'}`}>
                              {at.nombre}
                            </td>
                            <td className="py-1 px-2 text-slate-400">{at.tipo_dato}</td>
                            <td className="py-1 px-2 text-slate-400">{at.es_clave_primaria ? 'PK' : '—'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="py-2 text-slate-600 italic">Sin atributos</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Procesos DFD */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-2">
              <Workflow className="w-4 h-4 text-indigo-400" />
              3. Catálogo de Procesos (DFD)
            </h3>
            <div className="space-y-2">
              {procesos.map((p) => (
                <div key={p.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-start gap-3">
                  <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-800/50">
                    {p.numero_proceso}
                  </span>
                  <div>
                    <h5 className="font-bold text-slate-200 text-xs">{p.nombre}</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">{p.descripcion || 'Sin descripción detallada.'}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Puestos y Conexiones */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-2">
              <Users className="w-4 h-4 text-indigo-400" />
              4. Estructura de Puestos y Canales de Enlace (DCP)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {puestos.map((p) => (
                <div key={p.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="font-bold text-slate-200 text-xs mb-1">{p.nombre}</div>
                  <p className="text-[11px] text-slate-400">{p.descripcion || 'Puesto operativo de la estructura.'}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="p-6 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto max-h-[600px] leading-relaxed">
          <pre>{markdownContent}</pre>
        </div>
      )}
    </div>
  );
}
