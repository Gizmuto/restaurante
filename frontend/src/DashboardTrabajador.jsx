import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Calendar, UtensilsCrossed, DollarSign, XCircle, RefreshCw } from 'lucide-react';

const API_BASE = 'http://localhost/restaurante/backend/api';

function DashboardTrabajador({ user, onLogout }) {
  const [selectedMenuOption, setSelectedMenuOption] = useState(null);
  const [menus, setMenus] = useState([]);
  const [pedidoActual, setPedidoActual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [error, setError] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [horarioCerrado, setHorarioCerrado] = useState(false);
  
  const hoy = new Date().toISOString().slice(0, 10);
  const fechaFormateada = new Date().toLocaleDateString('es-CO', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Verificar horario (Forzando zona horaria Colombia)
  useEffect(() => {
    const verificarHorario = () => {
      // Crear fecha actual
      const ahora = new Date();
      
      // Obtener la hora específicamente en Colombia ('America/Bogota')
      // Esto devuelve una cadena tipo "17", "09", "23" basada en la zona horaria, no en el PC local
      const horaColombiaStr = ahora.toLocaleTimeString('en-US', {
        timeZone: 'America/Bogota',
        hour12: false,
        hour: 'numeric'
      });

      const horaColombia = parseInt(horaColombiaStr, 10);
      
      // Validar si es mayor o igual a 17 (5 PM)
      const esTarde = horaColombia >= 17; // >= 17 significa de 5:00 PM en adelante
      
      setHorarioCerrado(esTarde);
    };
    
    verificarHorario();
    // Revisar cada minuto
    const interval = setInterval(verificarHorario, 60000);
    return () => clearInterval(interval);
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    const empresaId = user?.empresa_id;
    const userId = user?.id;
    
    if (!empresaId) {
      setError('Usuario sin empresa asignada. Contacta al administrador.');
      setLoading(false);
      return;
    }
    
    if (!userId) {
      setError('Usuario no identificado. Vuelve a iniciar sesión.');
      setLoading(false);
      return;
    }
    
    cargarDatos(empresaId, userId);
  }, [user?.empresa_id, user?.id]);

  const showToast = (message, type = 'info', ms = 4000) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), ms);
  };

  const cargarDatos = async (empresaId, userId) => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        cargarMenus(empresaId),
        cargarPedidoActual(userId)
      ]);
    } catch (err) {
      setError(err.message || 'Error al cargar información');
      showToast('Error al cargar información', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarMenus = async (empresa_id) => {
    try {
      const url = `${API_BASE}/menus.php?empresa_id=${empresa_id}`;
      const res = await fetch(url);
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      
      if (data.menus && Array.isArray(data.menus)) {
        const menusActivos = data.menus.filter(m => 
          m.opciones && m.opciones.length >= 3
        );
        setMenus(menusActivos);
        
        if (menusActivos.length === 0) {
          showToast('No hay menús disponibles para hoy', 'warning');
        }
      } else {
        setMenus([]);
      }
    } catch (err) {
      setMenus([]);
      throw new Error(`Error al cargar menús: ${err.message}`);
    }
  };

  const cargarPedidoActual = async (trabajador_id) => {
    try {
      const url = `${API_BASE}/crear_pedido.php?trabajador_id=${trabajador_id}&fecha=${hoy}`;
      const res = await fetch(url);
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      
      if (data.tiene_pedido && data.pedido) {
        setPedidoActual(data.pedido);
        setObservaciones(data.pedido.observaciones || '');
        setSelectedMenuOption({
          menuId: data.pedido.menu_id,
          opcionId: data.pedido.opcion_id
        });
      } else {
        setPedidoActual(null);
        setSelectedMenuOption(null);
        setObservaciones('');
      }
    } catch (err) {
      console.error('Error al cargar pedido:', err);
      setPedidoActual(null);
    }
  };

  const confirmarPedido = async () => {
    if (!selectedMenuOption) {
      showToast('⚠️ Selecciona una opción primero', 'warning');
      return;
    }

    if (!user?.id) {
      showToast('Error: Usuario no identificado', 'error');
      return;
    }

    if (horarioCerrado) {
      showToast('⏰ El horario de pedidos ha cerrado (cierre: 5:00 PM)', 'error');
      return;
    }

    setSubmitting(true);
    
    try {
      const res = await fetch(`${API_BASE}/crear_pedido.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trabajador_id: user.id,
          opcion_id: selectedMenuOption.opcionId,
          fecha: hoy,
          observaciones: observaciones.trim() || null
        })
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        const accion = data.accion === 'creado' ? 'realizado' : 'actualizado';
        showToast(`✅ Pedido ${accion} correctamente`, 'success', 5000);
        await cargarPedidoActual(user.id);
      } else {
        showToast(data.error || '❌ Error al guardar pedido', 'error');
      }
    } catch (err) {
      console.error('Error al confirmar pedido:', err);
      showToast('❌ Error de conexión', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelarPedido = async () => {
    if (!pedidoActual) return;
    
    if (horarioCerrado) {
      showToast('⏰ No puedes cancelar después del horario límite', 'error');
      return;
    }

    const confirmacion = window.confirm('¿Estás seguro de cancelar tu pedido?');
    if (!confirmacion) return;

    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/crear_pedido.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trabajador_id: user.id,
          fecha: hoy
        })
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        showToast('✅ Pedido cancelado', 'success');
        setPedidoActual(null);
        setSelectedMenuOption(null);
        setObservaciones('');
      } else {
        showToast(data.error || '❌ Error al cancelar', 'error');
      }
    } catch (err) {
      console.error('Error al cancelar:', err);
      showToast('❌ Error de conexión', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getToastColor = (type) => {
    switch(type) {
      case 'success': return 'bg-green-50 border-green-500 text-green-800';
      case 'error': return 'bg-red-50 border-red-500 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-500 text-yellow-800';
      default: return 'bg-blue-50 border-blue-500 text-blue-800';
    }
  };

  // Pantalla de error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error al Cargar</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Reintentar
            </button>
            <button
              onClick={onLogout}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-orange-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-700 font-medium">Cargando menús disponibles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Toast */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-50 max-w-md animate-slideIn">
          <div className={`px-5 py-4 rounded-xl shadow-2xl border-l-4 ${getToastColor(toast.type)}`}>
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <UtensilsCrossed className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Comer Bien</h1>
                <p className="text-orange-100 text-sm">👤 {user?.nombre || 'Usuario'}</p>
              </div>
            </div>
            <button 
              onClick={onLogout} 
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Info Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-orange-600" />
            <div>
              <p className="text-sm text-gray-500">Fecha de pedido</p>
              <p className="font-semibold text-gray-800 capitalize">{fechaFormateada}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-orange-600" />
            <div>
              <p className="text-sm text-gray-500">Horario límite</p>
              <p className={`font-semibold ${horarioCerrado ? 'text-red-600' : 'text-green-600'}`}>
                {horarioCerrado ? 'Cerrado' : 'Abierto hasta 5:00 PM'}
              </p>
            </div>
          </div>

          {pedidoActual && (
            <div className="flex items-center gap-3 bg-green-50 px-4 py-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <p className="font-semibold text-green-700">Pedido Confirmado</p>
              </div>
            </div>
          )}
        </div>

        {/* Resumen de pedido actual */}
        {pedidoActual && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Tu Pedido de Hoy</h3>
                    <p className="text-sm text-gray-600">Ya tienes un pedido confirmado</p>
                  </div>
                </div>
                
                <div className="space-y-2 bg-white/60 rounded-lg p-4">
                  <p className="text-gray-700">
                    <span className="font-semibold">Menú:</span> {pedidoActual.menu_nombre}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Opción:</span> {pedidoActual.opcion_nombre}
                  </p>
                  <p className="text-gray-600 text-sm">{pedidoActual.opcion_descripcion}</p>
                  {pedidoActual.opcion_precio && (
                    <p className="text-xl font-bold text-green-700 mt-2">
                      ${Number(pedidoActual.opcion_precio).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                  {pedidoActual.observaciones && (
                    <p className="text-sm text-gray-600 mt-3 italic">
                      <span className="font-semibold">Observaciones:</span> {pedidoActual.observaciones}
                    </p>
                  )}
                </div>
              </div>
              
              {!horarioCerrado && (
                <button
                  onClick={cancelarPedido}
                  disabled={submitting}
                  className="ml-4 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  Cancelar
                </button>
              )}
            </div>
          </div>
        )}

        {/* Selector de menú */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <UtensilsCrossed className="w-7 h-7 text-orange-600" />
            {pedidoActual ? 'Cambiar tu Pedido' : 'Selecciona tu Menú'}
          </h2>
          
          {menus.length > 0 ? (
            <div className="space-y-6">
              {menus.map(menu => (
                <div key={menu.id} className="border-2 border-gray-200 rounded-xl p-6 hover:border-orange-300 transition-colors">
                  <h3 className="font-bold text-xl text-gray-800 mb-2">{menu.nombre}</h3>
                  {menu.descripcion && (
                    <p className="text-gray-600 mb-5">{menu.descripcion}</p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {menu.opciones.map(opcion => (
                      <button
                        key={opcion.opcion_id}
                        onClick={() => setSelectedMenuOption({ 
                          menuId: menu.id, 
                          opcionId: opcion.opcion_id 
                        })}
                        disabled={horarioCerrado}
                        className={`p-5 border-2 rounded-xl transition-all text-left ${
                          selectedMenuOption?.opcionId === opcion.opcion_id
                            ? 'border-orange-500 bg-orange-50 shadow-lg transform scale-105'
                            : 'border-gray-200 hover:border-orange-300 hover:shadow-md'
                        } ${horarioCerrado ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <p className="font-bold text-lg text-gray-800 mb-1">{opcion.nombre}</p>
                        <p className="text-sm text-gray-600 mb-3">{opcion.descripcion}</p>
                        {opcion.precio && (
                          <p className="text-xl font-bold text-orange-600">
                            ${Number(opcion.precio).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                          </p>
                        )}
                        {selectedMenuOption?.opcionId === opcion.opcion_id && (
                          <div className="mt-3 flex items-center gap-2 text-orange-600">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm font-semibold">Seleccionado</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Observaciones */}
              <div className="border-2 border-gray-200 rounded-xl p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Observaciones (opcional)
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  disabled={horarioCerrado}
                  placeholder="Ej: Sin cebolla, poca sal, etc."
                  className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
                  rows="3"
                  maxLength="200"
                />
                <p className="text-xs text-gray-500 mt-1">{observaciones.length}/200 caracteres</p>
              </div>
              
              {/* Botón de confirmación */}
              <button
                onClick={confirmarPedido}
                disabled={!selectedMenuOption || submitting || horarioCerrado}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-4 rounded-xl font-bold text-lg hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : horarioCerrado ? (
                  <>
                    <Clock className="w-6 h-6" />
                    Horario Cerrado
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6" />
                    {pedidoActual ? 'Actualizar Pedido' : 'Confirmar Pedido'}
                  </>
                )}
              </button>
              
              {horarioCerrado && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800">Horario de pedidos cerrado</p>
                    <p className="text-sm text-red-600 mt-1">
                      El límite para realizar o modificar pedidos es a las 5:00 PM. 
                      Vuelve mañana para hacer tu pedido.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hay menús disponibles para hoy</p>
              <p className="text-gray-400 text-sm mt-2">Consulta más tarde o contacta al administrador</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default DashboardTrabajador;