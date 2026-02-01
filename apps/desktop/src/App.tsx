import { HashRouter, Routes, Route } from 'react-router-dom';
import { SessionLauncher } from './pages/SessionLauncher';
import { CreateProject } from './pages/CreateProject';
import { ProjectHome } from './pages/ProjectHome';
import { StructureWizard } from './pages/StructureWizard';
import { BeatWizard } from './pages/BeatWizard';
import { StructureBoard } from './pages/StructureBoard';
import { QuickSprint } from './pages/QuickSprint';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<SessionLauncher />} />
        <Route path="/project/new" element={<CreateProject />} />
        <Route path="/project/:id" element={<ProjectHome />} />
        <Route path="/project/:id/sprint" element={<QuickSprint />} />
        <Route path="/project/:id/wizard" element={<StructureWizard />} />
        <Route path="/project/:id/beat" element={<BeatWizard />} />
        <Route path="/project/:id/board" element={<StructureBoard />} />
        <Route path="/sprint" element={<QuickSprint />} />
      </Routes>
    </HashRouter>
  );
}
