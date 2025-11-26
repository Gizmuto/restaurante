import React, { useState, useEffect } from 'react';
import Login from './pages/Login';

import DashboardAdministrador from './DashboardAdministrador.jsx';
import DashboardSupervisor from './DashboardSupervisor.jsx';
import DashboardTrabajador from './DashboardTrabajador.jsx';
import DashboardVendedor from './DashboardVendedor.jsx';

// Componente principal App con enrutamiento por roles
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  
  // Enrutamiento basado en el perfil del usuario
  switch (user.perfil?.toLowerCase()) {
    case 'administrador':
      return <DashboardAdministrador user={user} onLogout={handleLogout} />;
    case 'supervisor':
      return <DashboardSupervisor user={user} onLogout={handleLogout} />;
    case 'vendedor':
      return <DashboardVendedor user={user} onLogout={handleLogout} />;
    case 'trabajador':
      return <DashboardTrabajador user={user} onLogout={handleLogout} />;
    default:
      return <DashboardTrabajador user={user} onLogout={handleLogout} />;
  }
}