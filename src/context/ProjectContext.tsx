import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Proyecto {
  id: number;
  nombre: string;
  cliente: string;
  fecha_creacion: string;
}

interface ProjectContextType {
  proyectos: Proyecto[];
  currentProject: Proyecto | null;
  currentProjectId: number | null;
  selectProject: (id: number | null) => void;
  refreshProjects: () => Promise<void>;
  createProject: (nombre: string, cliente: string) => Promise<Proyecto>;
  deleteProject: (id: number) => Promise<void>;
  loading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/proyectos');
      const data = await res.json();
      setProyectos(data || []);

      // Si el proyecto actual fue eliminado o no existe, resetear
      if (currentProjectId && !data.some((p: Proyecto) => p.id === currentProjectId)) {
        setCurrentProjectId(null);
      }
    } catch (err) {
      console.error('Error al consultar proyectos en SQLite:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProjects();
  }, []);

  const selectProject = (id: number | null) => {
    setCurrentProjectId(id);
  };

  const createProject = async (nombre: string, cliente: string): Promise<Proyecto> => {
    const res = await fetch('/api/proyectos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nombre.trim(), cliente: cliente.trim() })
    });
    if (!res.ok) throw new Error('Error al registrar proyecto en base de datos');
    const nuevo = await res.json();
    await refreshProjects();
    setCurrentProjectId(nuevo.id);
    return nuevo;
  };

  const deleteProject = async (id: number): Promise<void> => {
    const res = await fetch(`/api/proyectos/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar proyecto');
    if (currentProjectId === id) {
      setCurrentProjectId(null);
    }
    await refreshProjects();
  };

  const currentProject = proyectos.find((p) => p.id === currentProjectId) || null;

  return (
    <ProjectContext.Provider
      value={{
        proyectos,
        currentProject,
        currentProjectId,
        selectProject,
        refreshProjects,
        createProject,
        deleteProject,
        loading
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject debe ser utilizado dentro de un ProjectProvider');
  }
  return context;
};
