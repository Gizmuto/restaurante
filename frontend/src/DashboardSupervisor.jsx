import React, { useState, useEffect } from 'react';
import MenusSection from './components/MenusSection';
import RecepcionPedidos from './components/RecepcionPedidos';

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
            {['pedidos', 'menus'].map(tab => (
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

        {/* Tab: Pedidos */}
        {activeTab === 'pedidos' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <RecepcionPedidos user={user} />
          </div>
        )}

        {/* Tab: Menús */}
        {activeTab === 'menus' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <MenusSection user={user} />
          </div>
        )}                         
      </div>
    </div>
  );
}
export default DashboardSupervisor