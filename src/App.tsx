import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ReportsDashboard } from './pages/ReportsDashboard';
import { ReportEditor } from './pages/ReportEditor';
import { ReportView } from './pages/ReportView';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ReportsDashboard />} />
        <Route path="/reports/new" element={<ReportEditor />} />
        <Route path="/reports/:id/edit" element={<ReportEditor />} />
        <Route path="/reports/:slug" element={<ReportView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

