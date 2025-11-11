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
export default DashboardAdministrador