import React, { useState, useEffect } from 'react';
import Login from './Login';

// Dashboard Vendedor
function DashboardVendedor({ user, onLogout }) {
  const [pedidos, setPedidos] = useState([]);
  const [resumen, setResumen] = useState([]);
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    fetch(`http://localhost/restaurante/backend/api/dashboard_vendedor.php?vendedor_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setPedidos(data.pedidos);
        setResumen(data.resumen);
        setHistorial(data.historial);
      })
      .catch((err) => console.error("Error al cargar API:", err));
  }, [user.id]);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <header className="bg-green-600 text-white py-4 px-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Panel del Vendedor</h1>
          <button 
            onClick={onLogout}
            className="bg-white text-green-600 px-4 py-2 rounded">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto py-6 space-y-6">

        {/* PEDIDOS DEL DÍA */}
        <section className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">📦 Pedidos del Día</h2>
          {pedidos.map(p => (
            <div key={p.id} className="flex justify-between border p-4 rounded mb-2">
              <div>
                <p className="font-semibold">{p.cliente}</p>
                <p className="text-sm text-gray-600">{p.opcion} - {p.menu}</p>
              </div>
              <span className={`px-3 py-1 rounded ${
                p.estado === "entregado" 
                ? "bg-green-100 text-green-700" 
                : "bg-yellow-100 text-yellow-700"
              }`}>
                {p.estado}
              </span>
            </div>
          ))}
        </section>

        {/* RESUMEN POR OPCIÓN */}
        <section className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">📊 Resumen por Opción de Menú</h2>
          {resumen.map(r => (
            <div key={r.opcion} className="flex justify-between border p-3 rounded mb-2">
              <span>{r.opcion}</span>
              <span className="font-bold text-green-700">{r.total}</span>
            </div>
          ))}
        </section>

        {/* HISTORIAL */}
        <section className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">🧾 Historial del Vendedor</h2>
          {historial.map(h => (
            <div key={h.id} className="flex justify-between border p-3 rounded mb-2">
              <span>{h.opcion}</span>
              <span>{h.accion}</span>
              <span className="text-sm text-gray-600">{h.fecha_hora}</span>
            </div>
          ))}
        </section>

      </div>
    </div>
  );
}

export default DashboardVendedor;

