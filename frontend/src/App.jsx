import React, { useState, useEffect } from 'react';
import Login from './pages/Login';

// Dashboard Administrador
function DashboardAdministrador({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('usuarios');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">👨‍💼 Panel Administrador</h1>
              <p className="text-sm text-purple-100">{user.nombre}</p>
            </div>
            <button onClick={onLogout} className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-50">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="flex border-b overflow-x-auto">
            {['usuarios', 'menus', 'pedidos', 'estadisticas'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-semibold capitalize ${
                  activeTab === tab 
                    ? 'border-b-2 border-purple-600 text-purple-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'usuarios' && (
          <div className="grid gap-4">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">👥 Gestión de Usuarios</h2>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 mb-4">
                ➕ Crear Usuario
              </button>
              <div className="space-y-2">
                {['Supervisor Juan', 'Vendedor María', 'Trabajador Pedro'].map((u, i) => (
                  <div key={i} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                    <span>{u}</span>
                    <div className="space-x-2">
                      <button className="text-blue-600 hover:underline">✏️ Editar</button>
                      <button className="text-red-600 hover:underline">🗑️ Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'menus' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">🍽️ Gestión de Menús</h2>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 mb-4">
              ➕ Crear Menú del Día
            </button>
            <div className="grid md:grid-cols-3 gap-4">
              {['Opción A: Pollo', 'Opción B: Pescado', 'Opción C: Vegetariano'].map((menu, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">{menu}</h3>
                  <p className="text-sm text-gray-600">Disponible hasta: 17:00</p>
                  <p className="text-sm text-gray-600">Pedidos: {15 + i * 5}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'pedidos' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">📋 Consolidado de Pedidos</h2>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Opción A</p>
                <p className="text-3xl font-bold text-blue-600">40</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Opción B</p>
                <p className="text-3xl font-bold text-green-600">25</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Opción C</p>
                <p className="text-3xl font-bold text-purple-600">35</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">⏰ Cierre de pedidos: Hoy 17:00</p>
          </div>
        )}

        {activeTab === 'estadisticas' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">📊 Dashboard y Estadísticas</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Menú más pedido</h3>
                <p className="text-2xl font-bold text-blue-600">Opción A - 40%</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Total pedidos hoy</h3>
                <p className="text-2xl font-bold text-green-600">100</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Dashboard Supervisor
function DashboardSupervisor({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('pedidos');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">👔 Panel Supervisor</h1>
              <p className="text-sm text-blue-100">{user.nombre}</p>
            </div>
            <button onClick={onLogout} className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="flex border-b overflow-x-auto">
            {['pedidos', 'menus', 'entregas'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-semibold capitalize ${
                  activeTab === tab 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'pedidos' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">📥 Recepción de Pedidos</h2>
            <div className="space-y-3">
              {[
                { empresa: 'Empresa A', pedidos: 25, hora: '16:45' },
                { empresa: 'Empresa B', pedidos: 18, hora: '16:30' },
                { empresa: 'Empresa C', pedidos: 32, hora: '16:55' }
              ].map((e, i) => (
                <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">{e.empresa}</p>
                    <p className="text-sm text-gray-600">{e.pedidos} pedidos - Recibido: {e.hora}</p>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Ver Detalle
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'menus' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">🍽️ Crear Menú del Día</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              ➕ Nuevo Menú
            </button>
          </div>
        )}

        {activeTab === 'entregas' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">🚚 Control de Entregas</h2>
            <div className="space-y-2">
              {['Empresa A - Pendiente', 'Empresa B - Entregado', 'Empresa C - En camino'].map((e, i) => (
                <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                  <span>{e}</span>
                  <button className="text-green-600 hover:underline">✓ Marcar Entregado</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Dashboard Vendedor
function DashboardVendedor({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">🛒 Panel Vendedor</h1>
              <p className="text-sm text-green-100">{user.nombre}</p>
            </div>
            <button onClick={onLogout} className="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold hover:bg-green-50">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📦 Entregas del Día</h2>
          <div className="space-y-3">
            {[
              { id: 1, empresa: 'Empresa A', pedidos: 25, estado: 'Pendiente' },
              { id: 2, empresa: 'Empresa B', pedidos: 18, estado: 'Entregado' }
            ].map(e => (
              <div key={e.id} className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <p className="font-semibold">{e.empresa}</p>
                  <p className="text-sm text-gray-600">{e.pedidos} pedidos</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  e.estado === 'Entregado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {e.estado}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">📊 Resumen</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Entregas Completadas</p>
              <p className="text-3xl font-bold text-green-600">12</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-3xl font-bold text-yellow-600">5</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard Trabajador
function DashboardTrabajador({ user, onLogout }) {
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(false);

  const menus = [
    { id: 1, nombre: 'Opción A: Pollo a la plancha', descripcion: 'Con arroz y ensalada', emoji: '🍗' },
    { id: 2, nombre: 'Opción B: Pescado al horno', descripcion: 'Con puré y vegetales', emoji: '🐟' },
    { id: 3, nombre: 'Opción C: Pasta vegetariana', descripcion: 'Con salsa de tomate', emoji: '🍝' }
  ];

  const confirmarPedido = () => {
    setPedidoConfirmado(true);
    setTimeout(() => setPedidoConfirmado(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Comer Bien</h1>
              <p className="text-sm text-orange-100">{user.nombre}</p>
            </div>
            <button onClick={onLogout} className="bg-white text-orange-900 px-4 py-2 rounded-lg font-bold hover:bg-orange-50">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded">
          <p className="font-semibold text-yellow-800">⏰ Recuerda: Los pedidos cierran hoy a las 17:00</p>
          <p className="text-sm text-yellow-700">Hora actual: 16:30</p>
        </div>

        {pedidoConfirmado && (
          <div className="bg-green-50 border border-green-200 p-4 mb-6 rounded-lg">
            <p className="text-green-800 font-semibold">✓ ¡Pedido confirmado exitosamente!</p>
          </div>
        )}

        <h2 className="text-xl font-bold mb-4">Selecciona tu menú del día:</h2>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {menus.map(menu => (
            <div
              key={menu.id}
              onClick={() => setSelectedMenu(menu.id)}
              className={`cursor-pointer border-2 rounded-xl p-6 transition-all ${
                selectedMenu === menu.id
                  ? 'border-orange-500 bg-orange-50 shadow-lg'
                  : 'border-gray-200 hover:border-orange-300 hover:shadow-md'
              }`}
            >
              <div className="text-4xl mb-3 text-center">{menu.emoji}</div>
              <h3 className="font-bold text-lg mb-2">{menu.nombre}</h3>
              <p className="text-sm text-gray-600">{menu.descripcion}</p>
              {selectedMenu === menu.id && (
                <div className="mt-3 text-center">
                  <span className="inline-block bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    ✓ Seleccionado
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={confirmarPedido}
          disabled={!selectedMenu}
          className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-4 rounded-xl font-bold text-lg hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {selectedMenu ? '✓ Confirmar mi Pedido' : '⚠️ Selecciona una opción primero'}
        </button>
      </div>
    </div>
  );
}


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