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
import { tieneAccesoRuta, obtenerRutaInicio } from './lib/permissions';

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

function RoleRoute({ ruta, children }) {
  const { user } = useAuth();
  if (!tieneAccesoRuta(user?.rol, ruta)) {
    return <Navigate to={obtenerRutaInicio(user?.rol)} replace />;
  }
  return children;
}

export default function App() {
  const { user, isAuthenticated, loading } = useAuth();

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
          element={
            isAuthenticated ? (
              <Navigate to={obtenerRutaInicio(user?.rol)} replace />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route
                    path="/"
                    element={
                      <RoleRoute ruta="/">
                        <PanelGeneral />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/beneficiarios"
                    element={
                      <RoleRoute ruta="/beneficiarios">
                        <Beneficiarios />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/entregas"
                    element={
                      <RoleRoute ruta="/entregas">
                        <Entregas />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/controles"
                    element={
                      <RoleRoute ruta="/controles">
                        <Controles />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/controles/menu"
                    element={
                      <RoleRoute ruta="/controles/menu">
                        <ModoMenu />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/controles/dashboard"
                    element={
                      <RoleRoute ruta="/controles/dashboard">
                        <DashboardControles />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/simulador"
                    element={
                      <RoleRoute ruta="/simulador">
                        <SimuladorWhatsapp />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="*"
                    element={
                      <Navigate to={obtenerRutaInicio(user?.rol)} replace />
                    }
                  />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
