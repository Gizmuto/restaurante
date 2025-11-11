import React, { useState, useEffect } from 'react';
import Login from './pages/Login';

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
export default DashboardSupervisor