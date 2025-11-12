import React, { useState, useEffect } from 'react';
import Login from './pages/Login';

// Dashboard Trabajador
function DashboardTrabajador({ user, onLogout }) {
  const [selectedMenuOption, setSelectedMenuOption] = useState(null);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(false);
  const [menus, setMenus] = useState([]);

  useEffect(() => {
    if (user?.empresa_id) {
      fetchMenusByEmpresa(user.empresa_id);
    } else {
      setMenus([]);
    }
  }, [user]);

  const fetchMenusByEmpresa = async (empresa_id) => {
    try {
      const res = await fetch(`http://localhost/restaurante/backend/api/menus.php?empresa_id=${empresa_id}`);
      const txt = await res.text();
      const data = JSON.parse(txt.replace(/^\uFEFF/, '').trim());
      setMenus(data.menus || []);
    } catch (err) {
      console.error('Error cargar menus trabajador', err);
      setMenus([]);
    }
  };

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
              <p className="text-sm text-orange-100">{user?.nombre}</p>
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
          {menus.length > 0 ? (
            // cada menu puede tener 'opciones' con idx, nombre y precio (según backend)
            menus.map(menu => (
              <div key={menu.id} className="col-span-3 md:col-span-1">
                <div className="border rounded-xl p-4">
                  <h3 className="font-bold text-lg mb-2">{menu.nombre}</h3>
                  <p className="text-sm text-gray-600 mb-3">{menu.descripcion}</p>

                  <div className="space-y-3">
                    {(menu.opciones || []).map((op) => (
                      <div
                        key={op.opcion_id || op.idx}
                        onClick={() => setSelectedMenuOption({ menuId: menu.id, opcionIdx: op.idx })}
                        className={`cursor-pointer p-3 rounded-lg border ${
                          selectedMenuOption && selectedMenuOption.menuId === menu.id && selectedMenuOption.opcionIdx === op.idx
                            ? 'border-orange-500 bg-orange-50 shadow-lg'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">Opción {String.fromCharCode(64 + (op.idx || 1))}: {op.nombre}</p>
                            {op.descripcion && <p className="text-sm text-gray-600">{op.descripcion}</p>}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-orange-600">{op.precio !== null && op.precio !== undefined ? `${op.precio.toFixed(2)}` : '—'}</p>
                          </div>
                        </div>
                        {selectedMenuOption && selectedMenuOption.menuId === menu.id && selectedMenuOption.opcionIdx === op.idx && (
                          <div className="mt-2 text-center">
                            <span className="inline-block bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">✓ Seleccionado</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No hay menús publicados para tu empresa.</p>
          )}
        </div>

        <button
          onClick={confirmarPedido}
          disabled={!selectedMenuOption}
          className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-4 rounded-xl font-bold text-lg hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {selectedMenuOption ? '✓ Confirmar mi Pedido' : '⚠️ Selecciona una opción primero'}
        </button>
      </div>
    </div>
  );
}
export default DashboardTrabajador