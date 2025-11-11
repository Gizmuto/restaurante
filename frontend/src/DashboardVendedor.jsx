import React, { useState, useEffect } from 'react';
import Login from './pages/Login';

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
export default DashboardVendedor
