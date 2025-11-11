import React, { useState, useEffect } from 'react';
import Login from './pages/Login';

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
export default DashboardTrabajador