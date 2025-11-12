import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost/restaurante/backend/api';

function RecepcionPedidos({ user }) {
  const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().slice(0, 10));
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [empresas, setEmpresas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, porOpcion: {} });
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [vistaAgrupada, setVistaAgrupada] = useState('trabajador'); // 'trabajador' o 'empresa'
  const [expandidos, setExpandidos] = useState({});

  const showToast = (message, type = 'info', ms = 3000) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), ms);
  };

  useEffect(() => {
    cargarEmpresas();
  }, []);

  useEffect(() => {
    if (filtroFecha) {
      cargarPedidos();
    }
  }, [filtroFecha, filtroEmpresa]);

  const cargarEmpresas = async () => {
    try {
      const res = await fetch(`${API_BASE}/empresas.php`);
      const txt = await res.text();
      const data = JSON.parse(txt.replace(/^\uFEFF/, '').trim());
      setEmpresas(data.empresas || []);
    } catch (err) {
      console.error('Error cargar empresas:', err);
      showToast('Error al cargar empresas', 'error');
    }
  };

  const cargarPedidos = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/pedidos.php?fecha=${filtroFecha}`;
      if (filtroEmpresa) {
        url += `&empresa_id=${filtroEmpresa}`;
      }
      
      const res = await fetch(url);
      const txt = await res.text();
      const data = JSON.parse(txt.replace(/^\uFEFF/, '').trim());
      
      if (res.ok) {
        setPedidos(data.pedidos || []);
        calcularEstadisticas(data.pedidos || []);
      } else {
        showToast(data.error || 'Error al cargar pedidos', 'error');
      }
    } catch (err) {
      console.error('Error cargar pedidos:', err);
      showToast('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calcularEstadisticas = (pedidosList) => {
    const porOpcion = {};
    let total = 0;

    pedidosList.forEach(p => {
      if (p.opcion_nombre) {
        porOpcion[p.opcion_nombre] = (porOpcion[p.opcion_nombre] || 0) + 1;
        total++;
      }
    });

    setStats({ total, porOpcion });
  };

  const agruparPedidos = () => {
    if (vistaAgrupada === 'trabajador') {
      const grupos = {};
      pedidos.forEach(p => {
        const key = `${p.trabajador_nombre}_${p.trabajador_id}`;
        if (!grupos[key]) {
          grupos[key] = {
            trabajador_nombre: p.trabajador_nombre,
            trabajador_id: p.trabajador_id,
            trabajador_identificacion: p.trabajador_identificacion,
            empresa_nombre: p.empresa_nombre,
            pedidos: []
          };
        }
        grupos[key].pedidos.push(p);
      });
      return Object.values(grupos);
    } else {
      const grupos = {};
      pedidos.forEach(p => {
        const key = p.empresa_id || 'sin_empresa';
        if (!grupos[key]) {
          grupos[key] = {
            empresa_nombre: p.empresa_nombre || 'Sin empresa',
            empresa_id: p.empresa_id,
            pedidos: []
          };
        }
        grupos[key].pedidos.push(p);
      });
      return Object.values(grupos);
    }
  };

  const toggleExpandir = (key) => {
    setExpandidos(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const grupos = agruparPedidos();

  const exportarExcel = () => {
    let csv = 'Trabajador,Identificación,Empresa,Opción,Menú,Precio,Fecha\n';
    pedidos.forEach(p => {
      csv += `"${p.trabajador_nombre}","${p.trabajador_identificacion}","${p.empresa_nombre}","${p.opcion_nombre}","${p.menu_nombre}",${p.opcion_precio || 0},"${p.fecha}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pedidos_${filtroFecha}.csv`;
    link.click();
    showToast('Archivo exportado', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      <div className="fixed top-6 right-6 z-50">
        {toast.show && (
          <div className={`max-w-sm px-4 py-3 rounded-lg shadow-lg text-white ${
            toast.type === 'success' ? 'bg-green-600' :
            toast.type === 'error' ? 'bg-red-600' :
            toast.type === 'warning' ? 'bg-yellow-600 text-black' :
            'bg-blue-600'
          }`}>
            {toast.message}
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">📋 Recepción de Pedidos</h2>
        <button
          onClick={exportarExcel}
          disabled={pedidos.length === 0}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-semibold"
        >
          📊 Exportar Excel
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📅 Fecha
            </label>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🏢 Empresa
            </label>
            <select
              value={filtroEmpresa}
              onChange={(e) => setFiltroEmpresa(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todas las empresas</option>
              {empresas.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              👁️ Vista
            </label>
            <select
              value={vistaAgrupada}
              onChange={(e) => setVistaAgrupada(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="trabajador">Por Trabajador</option>
              <option value="empresa">Por Empresa</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={cargarPedidos}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-semibold"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <p className="text-sm font-semibold mb-1">Total Pedidos</p>
          <p className="text-4xl font-bold">{stats.total}</p>
        </div>
        
        {Object.entries(stats.porOpcion).map(([opcion, cantidad], idx) => {
          const colors = [
            'from-green-500 to-green-600',
            'from-purple-500 to-purple-600',
            'from-orange-500 to-orange-600'
          ];
          return (
            <div key={opcion} className={`bg-gradient-to-br ${colors[idx % 3]} text-white p-6 rounded-xl shadow-lg`}>
              <p className="text-sm font-semibold mb-1">{opcion}</p>
              <p className="text-4xl font-bold">{cantidad}</p>
              <p className="text-xs mt-1 opacity-90">
                {stats.total > 0 ? Math.round((cantidad / stats.total) * 100) : 0}%
              </p>
            </div>
          );
        })}
      </div>

      {/* Lista de pedidos agrupados */}
      <div className="bg-white rounded-xl shadow-md p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Cargando pedidos...</p>
          </div>
        ) : grupos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">📭 No hay pedidos para la fecha seleccionada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grupos.map((grupo, idx) => {
              const key = vistaAgrupada === 'trabajador' 
                ? `${grupo.trabajador_id}_${idx}`
                : `${grupo.empresa_id}_${idx}`;
              const isExpanded = expandidos[key];

              return (
                <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div
                    onClick={() => toggleExpandir(key)}
                    className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition"
                  >
                    <div>
                      {vistaAgrupada === 'trabajador' ? (
                        <>
                          <h3 className="font-bold text-lg text-gray-800">
                            👤 {grupo.trabajador_nombre}
                          </h3>
                          <p className="text-sm text-gray-600">
                            ID: {grupo.trabajador_identificacion} | {grupo.empresa_nombre}
                          </p>
                        </>
                      ) : (
                        <h3 className="font-bold text-lg text-gray-800">
                          🏢 {grupo.empresa_nombre}
                        </h3>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                        {grupo.pedidos.length} pedido{grupo.pedidos.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-gray-400">
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 bg-white">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            {vistaAgrupada === 'empresa' && (
                              <th className="text-left p-3 text-sm font-semibold text-gray-700">Trabajador</th>
                            )}
                            <th className="text-left p-3 text-sm font-semibold text-gray-700">Menú</th>
                            <th className="text-left p-3 text-sm font-semibold text-gray-700">Opción</th>
                            <th className="text-right p-3 text-sm font-semibold text-gray-700">Precio</th>
                            <th className="text-center p-3 text-sm font-semibold text-gray-700">Fecha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grupo.pedidos.map((pedido, pidx) => (
                            <tr key={pidx} className="border-t border-gray-100 hover:bg-gray-50">
                              {vistaAgrupada === 'empresa' && (
                                <td className="p-3 text-sm">
                                  <div className="font-medium text-gray-800">{pedido.trabajador_nombre}</div>
                                  <div className="text-xs text-gray-500">{pedido.trabajador_identificacion}</div>
                                </td>
                              )}
                              <td className="p-3 text-sm text-gray-700">{pedido.menu_nombre}</td>
                              <td className="p-3">
                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                  {pedido.opcion_nombre}
                                </span>
                              </td>
                              <td className="p-3 text-right font-semibold text-gray-800">
                                ${Number(pedido.opcion_precio || 0).toFixed(2)}
                              </td>
                              <td className="p-3 text-center text-sm text-gray-600">
                                {new Date(pedido.fecha).toLocaleDateString('es-CO')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default RecepcionPedidos;