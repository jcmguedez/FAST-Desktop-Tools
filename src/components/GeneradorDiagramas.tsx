import { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { 
  Database, 
  Workflow, 
  Users, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  Code2, 
  Eye, 
  Maximize2,
  CalendarRange
} from 'lucide-react';
import { Entidad } from './GestionEntidades';
import { TareaGantt } from './GestionGantt';

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

interface GeneradorDiagramasProps {
  proyectoId: number;
  proyectoNombre?: string;
  entidades: Entidad[];
  procesos: Proceso[];
  flujos: FlujoDato[];
  puestos: Puesto[];
  conexiones: ConexionPuesto[];
  tareasGantt?: TareaGantt[];
}

export default function GeneradorDiagramas({
  proyectoId,
  proyectoNombre,
  entidades,
  procesos,
  flujos,
  puestos,
  conexiones,
  tareasGantt = []
}: GeneradorDiagramasProps) {
  const [diagramType, setDiagramType] = useState<'erd' | 'dfd' | 'dcp' | 'gantt'>('erd');
  const [mermaidCode, setMermaidCode] = useState<string>('');
  const [svgContent, setSvgContent] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState<boolean>(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Inicializar Mermaid con tema oscuro elegante
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        darkMode: true,
        background: '#090d16',
        primaryColor: '#4f46e5',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#6366f1',
        lineColor: '#818cf8',
        secondaryColor: '#1e1b4b',
        tertiaryColor: '#0f172a'
      },
      fontFamily: 'ui-sans-serif, system-ui, sans-serif'
    });
  }, []);

  // 1. Generar sintaxis Mermaid para Modelo Entidad-Relación (DER/ERD)
  const generateERDCode = (): string => {
    if (entidades.length === 0) {
      return `erDiagram\n    PROYECTO_VACIO {\n        string mensaje "Agrega entidades para generar el DER"\n    }`;
    }

    let code = 'erDiagram\n';

    // Generar entidades y sus atributos
    entidades.forEach((ent) => {
      // Limpiar nombre para sintaxis válida en Mermaid (sin espacios)
      const sanitizedName = ent.nombre.replace(/[^a-zA-Z0-9_]/g, '_');
      code += `    ${sanitizedName} {\n`;
      
      if (ent.atributos && ent.atributos.length > 0) {
        ent.atributos.forEach((at) => {
          const atName = at.nombre.replace(/[^a-zA-Z0-9_]/g, '_');
          // Formato tipo simplificado
          const tipoSimple = at.tipo_dato.split('(')[0].toLowerCase();
          const pkLabel = at.es_clave_primaria ? 'PK' : '';
          code += `        ${tipoSimple} ${atName} ${pkLabel}\n`;
        });
      } else {
        code += `        int id_generico PK\n`;
      }

      code += `    }\n`;
    });

    // Relaciones tentativas entre entidades si comparten nombres de clave
    if (entidades.length > 1) {
      for (let i = 0; i < entidades.length - 1; i++) {
        const entA = entidades[i].nombre.replace(/[^a-zA-Z0-9_]/g, '_');
        const entB = entidades[i + 1].nombre.replace(/[^a-zA-Z0-9_]/g, '_');
        code += `    ${entA} ||--o{ ${entB} : "se relaciona con"\n`;
      }
    }

    return code;
  };

  // 2. Generar sintaxis Mermaid para Diagrama de Flujo de Datos (DFD)
  const generateDFDCode = (): string => {
    if (procesos.length === 0) {
      return `flowchart TD\n    A[Sin Procesos] --> B[Agrega procesos para renderizar el DFD]`;
    }

    let code = 'flowchart TD\n';
    code += '    classDef process fill:#1e1b4b,stroke:#6366f1,stroke-width:2px,color:#fff,rx:8,ry:8;\n';
    code += '    classDef entity fill:#0f172a,stroke:#3b82f6,stroke-width:1.5px,color:#93c5fd;\n';

    // Declarar procesos como nodos circulares/redondeados con su número
    procesos.forEach((p) => {
      const procId = `P_${p.id}`;
      const label = `"${p.numero_proceso}<br/><b>${p.nombre}</b>"`;
      code += `    ${procId}(${label}):::process\n`;
    });

    // Conectar flujos de datos
    if (flujos.length > 0) {
      flujos.forEach((f, idx) => {
        const desc = f.descripcion ? `|"${f.descripcion}"|` : '';
        if (f.proceso_origen_id && f.proceso_destino_id) {
          code += `    P_${f.proceso_origen_id} -->${desc} P_${f.proceso_destino_id}\n`;
        } else if (f.proceso_origen_id && f.entidad_id) {
          const entId = `E_${f.entidad_id}`;
          code += `    ${entId}[("${f.entidad_nombre || 'Almacén de Datos'}")]:::entity\n`;
          code += `    P_${f.proceso_origen_id} -->${desc} ${entId}\n`;
        } else if (f.entidad_id && f.proceso_destino_id) {
          const entId = `E_${f.entidad_id}`;
          code += `    ${entId}[("${f.entidad_nombre || 'Entidad Externa'}")]:::entity\n`;
          code += `    ${entId} -->${desc} P_${f.proceso_destino_id}\n`;
        }
      });
    } else if (procesos.length > 1) {
      // Si no hay flujos explícitos, enlazar secuencialmente por proceso
      for (let i = 0; i < procesos.length - 1; i++) {
        code += `    P_${procesos[i].id} -.->|"flujo sugerido"| P_${procesos[i + 1].id}\n`;
      }
    }

    return code;
  };

  // 3. Generar sintaxis Mermaid para Diagrama de Conexión de Puestos (DCP)
  const generateDCPCode = (): string => {
    if (puestos.length === 0) {
      return `graph LR\n    A[Sin Puestos] --> B[Registra puestos de trabajo para visualizar el DCP]`;
    }

    let code = 'graph LR\n';
    code += '    classDef puesto fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff;\n';

    puestos.forEach((p) => {
      const pId = `PST_${p.id}`;
      code += `    ${pId}["<b>${p.nombre}</b><br/><small>${p.descripcion || 'Puesto de Trabajo'}</small>"]:::puesto\n`;
    });

    if (conexiones.length > 0) {
      conexiones.forEach((c) => {
        const tipo = c.tipo_conexion ? `|"${c.tipo_conexion}"|` : '';
        code += `    PST_${c.puesto_origen_id} ==> ${tipo} PST_${c.puesto_destino_id}\n`;
      });
    } else if (puestos.length > 1) {
      for (let i = 0; i < puestos.length - 1; i++) {
        code += `    PST_${puestos[i].id} ==>|"Canal Administrativo"| PST_${puestos[i + 1].id}\n`;
      }
    }

    return code;
  };

  // 4. Generar sintaxis Mermaid para Cronograma (Gantt)
  const generateGanttCode = (): string => {
    if (!tareasGantt || tareasGantt.length === 0) {
      return `gantt\n    title Cronograma del Proyecto FAST - Sin Tareas\n    dateFormat YYYY-MM-DD\n    axisFormat %d/%m\n    section Planificación Inicial\n    Registra tareas en el módulo de Cronograma :des1, 2026-10-28, 5d`;
    }

    let code = 'gantt\n';
    const cleanTitle = (proyectoNombre || 'FAST').replace(/[:;#\n]/g, ' ');
    code += `    title Cronograma Metodológico FAST - ${cleanTitle}\n`;
    code += '    dateFormat YYYY-MM-DD\n';
    code += '    axisFormat %d/%m\n';

    // Agrupar tareas por fase_asociada
    const fasesMap = new Map<string, TareaGantt[]>();
    tareasGantt.forEach((t) => {
      const fase = t.fase_asociada || 'Fase General';
      if (!fasesMap.has(fase)) {
        fasesMap.set(fase, []);
      }
      fasesMap.get(fase)!.push(t);
    });

    fasesMap.forEach((tasksInFase, faseName) => {
      const cleanFase = faseName.replace(/[:;#\n]/g, '-');
      code += `\n    section ${cleanFase}\n`;
      tasksInFase.forEach((t, idx) => {
        const cleanName = t.nombre_tarea.replace(/[:;#\n]/g, ' ');
        const taskId = `t${t.id || idx}`;
        code += `    ${cleanName} :${taskId}, ${t.fecha_inicio}, ${t.duracion_dias}d\n`;
      });
    });

    return code;
  };

  // Actualizar código Mermaid al cambiar de pestaña o de datos
  useEffect(() => {
    let generated = '';
    if (diagramType === 'erd') {
      generated = generateERDCode();
    } else if (diagramType === 'dfd') {
      generated = generateDFDCode();
    } else if (diagramType === 'dcp') {
      generated = generateDCPCode();
    } else if (diagramType === 'gantt') {
      generated = generateGanttCode();
    }
    setMermaidCode(generated);
  }, [diagramType, entidades, procesos, flujos, puestos, conexiones, tareasGantt, proyectoNombre]);

  // Renderizar con Mermaid
  useEffect(() => {
    if (!mermaidCode) return;

    let isMounted = true;
    const renderDiagram = async () => {
      try {
        setIsRendering(true);
        setRenderError(null);
        const id = `mermaid_${Date.now()}`;
        const { svg } = await mermaid.render(id, mermaidCode);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err: any) {
        console.error('Error renderizando Mermaid:', err);
        if (isMounted) {
          setRenderError('Error al renderizar el diagrama Mermaid con los datos actuales.');
        }
      } finally {
        if (isMounted) setIsRendering(false);
      }
    };

    renderDiagram();
    return () => {
      isMounted = false;
    };
  }, [mermaidCode]);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(mermaidCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSVG = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagrama-${diagramType}-${proyectoId}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-0">
      {/* Barra de control del generador */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Selector de tipo de diagrama */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setDiagramType('erd')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              diagramType === 'erd' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Modelo ERD (DER)</span>
          </button>
          <button
            onClick={() => setDiagramType('dfd')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              diagramType === 'dfd' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>Flujo de Datos (DFD)</span>
          </button>
          <button
            onClick={() => setDiagramType('dcp')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              diagramType === 'dcp' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Conexión de Puestos (DCP)</span>
          </button>
          <button
            onClick={() => setDiagramType('gantt')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              diagramType === 'gantt' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Cronograma (Gantt)</span>
          </button>
        </div>

        {/* Acciones: Ver código, Copiar, Descargar SVG */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCode(!showCode)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
              showCode
                ? 'bg-slate-800 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showCode ? 'Ocultar Código' : 'Ver Código Mermaid'}</span>
          </button>

          <button
            onClick={handleCopyCode}
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
                <span>Copiar Mermaid</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadSVG}
            disabled={!svgContent}
            className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar SVG</span>
          </button>
        </div>
      </div>

      {/* Editor / Vista de código opcional */}
      {showCode && (
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto max-h-48">
          <pre>{mermaidCode}</pre>
        </div>
      )}

      {/* Lienzo de Renderizado del Diagrama */}
      <div 
        ref={containerRef}
        className="p-8 min-h-[480px] bg-slate-950 flex items-center justify-center overflow-auto relative"
      >
        {isRendering ? (
          <div className="flex flex-col items-center gap-2 text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
            <span>Compilando diagrama con Mermaid.js...</span>
          </div>
        ) : renderError ? (
          <div className="p-6 text-center text-xs text-rose-300 max-w-md bg-rose-950/30 border border-rose-900/40 rounded-xl">
            {renderError}
          </div>
        ) : svgContent ? (
          <div 
            className="w-full h-full flex items-center justify-center [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:drop-shadow-lg"
            dangerouslySetInnerHTML={{ __html: svgContent }} 
          />
        ) : (
          <div className="text-xs text-slate-500 text-center">
            No hay información suficiente para generar el diagrama. Agrega datos desde los formularios.
          </div>
        )}
      </div>

      {/* Pie descriptivo del diagrama */}
      <div className="px-6 py-3 bg-slate-950 border-t border-slate-800/80 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="font-semibold text-slate-400">Tipo de Diagrama:</span>{' '}
          {diagramType === 'erd' && 'Modelo Entidad-Relación (DER) derivado de tablas "entidades" y "atributos".'}
          {diagramType === 'dfd' && 'Diagrama de Flujo de Datos (DFD) nivel de procesos e intercambios.'}
          {diagramType === 'dcp' && 'Diagrama de Conexión de Puestos (DCP) según metodología FAST.'}
          {diagramType === 'gantt' && 'Diagrama de Gantt del cronograma del proyecto organizado por fases metodológicas FAST.'}
        </div>
        <div className="text-slate-400 font-mono text-[10px]">
          Renderizado en cliente · Cero dependencias externas
        </div>
      </div>
    </div>
  );
}
