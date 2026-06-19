import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PanelGeneral from './pages/PanelGeneral';
import Beneficiarios from './pages/Beneficiarios';
import Entregas from './pages/Entregas';
import SimuladorWhatsapp from './pages/SimuladorWhatsapp';
import Controles from './pages/Controles';
import ModoMenu from './pages/ModoMenu';
import DashboardControles from './pages/DashboardControles';
import Login from './pages/Login';
import { useAuth } from './lib/auth';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-ledger-950 flex items-center justify-center">
        <div className="text-paper-400 text-lg">Cargando...</div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-ledger-950 flex items-center justify-center">
        <div className="text-paper-400 text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<PanelGeneral />} />
                  <Route path="/beneficiarios" element={<Beneficiarios />} />
                  <Route path="/entregas" element={<Entregas />} />
                  <Route path="/controles" element={<Controles />} />
                  <Route path="/controles/menu" element={<ModoMenu />} />
                  <Route path="/controles/dashboard" element={<DashboardControles />} />
                  <Route path="/simulador" element={<SimuladorWhatsapp />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
