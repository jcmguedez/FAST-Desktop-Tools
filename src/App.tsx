import { ProjectProvider, useProject } from './context/ProjectContext';
import ProjectDashboard from './components/ProjectDashboard';
import Workspace from './components/Workspace';

function AppContent() {
  const { currentProjectId } = useProject();

  // Si no hay proyecto seleccionado, mostrar el Dashboard Asistido
  if (!currentProjectId) {
    return <ProjectDashboard />;
  }

  // Vista de Trabajo (Workspace) con Sidebar organizado por las 3 Fases FAST
  return <Workspace />;
}

export default function App() {
  return (
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  );
}
