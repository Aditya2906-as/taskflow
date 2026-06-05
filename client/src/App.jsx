import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider }        from './context/SocketContext';
import { NotifProvider }         from './context/NotificationContext';
import Navbar       from './components/Navbar';
import Sidebar      from './components/Sidebar';
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BoardPage    from './pages/BoardPage';
import SettingsPage from './pages/SettingsPage';
import ManualPage   from './pages/ManualPage';
import AiPage       from './pages/AiPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AIGeneratorPage    from './pages/AIGeneratorPage';
import WikiPage           from './pages/WikiPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div className="spinner" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/" replace />;
}

function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="shell">
      <Navbar onMenuClick={() => setSidebarOpen(v => !v)} />
      <div className="body-wrap">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="content" onClick={() => setSidebarOpen(false)}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Providers({ children }) {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotifProvider>{children}</NotifProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
          <Route path="/" element={
            <PrivateRoute><AppShell><DashboardPage /></AppShell></PrivateRoute>
          } />
          <Route path="/settings" element={
            <PrivateRoute><AppShell><SettingsPage /></AppShell></PrivateRoute>
          } />
          <Route path="/manual" element={
            <PrivateRoute><AppShell><ManualPage /></AppShell></PrivateRoute>
          } />
          <Route path="/ai" element={
            <PrivateRoute><AppShell><AiPage /></AppShell></PrivateRoute>
          } />
          <Route path="/ai-generator" element={
            <PrivateRoute><AppShell><AIGeneratorPage /></AppShell></PrivateRoute>
          } />
          <Route path="/board/:id" element={
            <PrivateRoute>
              <div className="shell">
                <Navbar onMenuClick={() => {}} />
                <BoardPage />
              </div>
            </PrivateRoute>
          } />
          <Route path="/board/:id/wiki" element={
            <PrivateRoute>
              <div className="shell" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Navbar onMenuClick={() => {}} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <WikiPage />
                </div>
              </div>
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </Providers>
  );
}