import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Calendar, UtensilsCrossed, DollarSign, XCircle } from 'lucide-react';

const API_BASE = 'http://localhost/restaurante/backend/api';

function DashboardTrabajadorMejorado({ user, onLogout }) {
  // Estados principales
  const [selectedMenuOption, setSelectedMenuOption] = useState(null);
  const [menus, setMenus] = useState([]);
  const [pedidoActual, setPedidoActual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [error, setError] = useState(null);
  
  // Estados adicionales
  const [observaciones, setObservaciones] = useState('');
  const [horarioCerrado, setHorarioCerrado] = useState(false);
  
  // Fecha de hoy
  const hoy = new Date().toISOString().slice(0, 10);
  const horaActual = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  // ⭐ DEBUG: Mostrar info del usuario al cargar
  useEffect(() => {
    console.log('👤 Usuario recibido:', user);
    console.log('🏢 Empresa ID:', user?.empresa_id);
    console.log('🆔 Usuario ID:', user?.id);
  }, [user]);

  // Verificar horario de cierre
  useEffect(() => {
    const verificarHorario = () => {
      const ahora = new Date();
      const hora = ahora.getHours();
      const minutos = ahora.getMinutes();
      const horaEnMinutos = hora * 60 + minutos;
      const horaCierre = 17 * 60;
      
      setHorarioCerrado(horaEnMinutos >= horaCierre);
    };
    
    verificarHorario();
    const interval = setInterval(verificarHorario, 60000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const empresaId = user?.empresa_id;
    const userId = user?.id;
    
    console.log('🔄 useEffect - Validando datos:', { empresaId, userId, user });
    
    if (!empresaId) {
      console.error('❌ Empresa ID no encontrado');
      setError('Usuario sin empresa asignada. Por favor contacta al administrador.');
      setLoading(false);
      return;
    }
    
    if (!userId) {
      console.error('❌ Usuario ID no encontrado');
      setError('Usuario no identificado. Por favor vuelve a iniciar sesión.');
      setLoading(false);
      return;
    }
    
    console.log('✅ Datos válidos, cargando...');
    cargarDatos(empresaId, userId);
  }, [user?.empresa_id, user?.id]);

  const showToast = (message, type = 'info', ms = 4000) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), ms);
  };

  const cargarDatos = async (empresaId, userId) => {
    console.log('🔄 cargarDatos iniciado:', { empresaId, userId });
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        cargarMenus(empresaId),
        cargarPedidoActual(userId)
      ]);
      console.log('✅ Datos cargados exitosamente');
    } catch (err) {
      console.error('❌ Error al cargar datos:', err);
      setError(err.message || 'Error al cargar información');
      showToast('Error al cargar información', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarMenus = async (empresa_id) => {
    console.log('📋 Cargando menús para empresa:', empresa_id);
    
    try {
      const url = `${API_BASE}/menus.php?empresa_id=${empresa_id}`;
      console.log('🌐 Fetching:', url);
      
      const res = await fetch(url);
      console.log('📡 Response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('✅ Menús recibidos:', data);
      
      if (data.menus && Array.isArray(data.menus)) {
        const menusActivos = data.menus.filter(m => 
          m.opciones && m.opciones.length >= 3
        );
        console.log('📊 Menús activos:', menusActivos.length);
        setMenus(menusActivos);
        
        if (menusActivos.length === 0) {
          showToast('No hay menús disponibles para hoy', 'warning');
        }
      } else {
        console.warn('⚠️ Respuesta sin menús válidos');
        setMenus([]);
      }
    } catch (err) {
      console.error('❌ Error en cargarMenus:', err);
      setMenus([]);
      throw new Error(`Error al cargar menús: ${err.message}`);
    }
  };

  const cargarPedidoActual = async (trabajador_id) => {
    console.log('🍽️ Cargando pedido para trabajador:', trabajador_id);
    
    try {
      const url = `${API_BASE}/crear_pedido.php?trabajador_id=${trabajador_id}&fecha=${hoy}`;
      console.log('🌐 Fetching:', url);
      
      const res = await fetch(url);
      console.log('📡 Response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('✅ Pedido recibido:', data);
      
      if (data.tiene_pedido && data.pedido) {
        setPedidoActual(data.pedido);
        setObservaciones(data.pedido.observaciones || '');
        
        setSelectedMenuOption({
          menuId: data.pedido.menu_id,
          opcionId: data.pedido.opcion_id
        });
      } else {
        console.log('ℹ️ Usuario sin pedido actual');
        setPedidoActual(null);
        setSelectedMenuOption(null);
        setObservaciones('');
      }
    } catch (err) {
      console.error('❌ Error en cargarPedidoActual:', err);
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
      showToast('⏰ El horario de pedidos ha cerrado', 'error');
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
    if (!pedidoActual || horarioCerrado) return;

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

  const getToastIcon = (type) => {
    switch(type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  // Pantalla de error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error al Cargar</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="bg-gray-100 p-4 rounded-lg mb-6 text-left">
            <p className="text-xs text-gray-500 font-mono">Debug Info:</p>
            <pre className="text-xs text-gray-700 mt-2">
              {JSON.stringify({ 
                empresa_id: user?.empresa_id, 
                user_id: user?.id,
                perfil: user?.perfil 
              }, null, 2)}
            </pre>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700"
            >
              Reiniciar Sesión
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-orange-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-700 font-medium">Cargando menús disponibles...</p>
          <p className="text-gray-500 text-sm mt-2">Por favor espera</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Toast */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-50 max-w-md animate-slideIn">
          <div className={`px-5 py-4 rounded-xl shadow-2xl border-l-4 ${
            toast.type === 'success' ? 'bg-green-50 border-green-500' :
            toast.type === 'error' ? 'bg-red-50 border-red-500' :
            toast.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
            'bg-blue-50 border-blue-500'
          }`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{getToastIcon(toast.type)}</span>
              <p className={`text-sm font-medium ${
                toast.type === 'success' ? 'text-green-800' :
                toast.type === 'error' ? 'text-red-800' :
                toast.type === 'warning' ? 'text-yellow-800' :
                'text-blue-800'
              }`}>
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white shadow-2xl">
        <div className="max-w-5xl mx-auto px-4 py-5">
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

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Selecciona tu Menú</h2>
          
          {menus.length > 0 ? (
            <div className="space-y-4">
              {menus.map(menu => (
                <div key={menu.id} className="border p-4 rounded-lg">
                  <h3 className="font-bold text-lg">{menu.nombre}</h3>
                  <p className="text-sm text-gray-600 mb-4">{menu.descripcion}</p>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {menu.opciones.map(op => (
                      <button
                        key={op.opcion_id}
                        onClick={() => setSelectedMenuOption({ 
                          menuId: menu.id, 
                          opcionId: op.opcion_id 
                        })}
                        className={`p-4 border-2 rounded-lg ${
                          selectedMenuOption?.opcionId === op.opcion_id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        <p className="font-semibold">{op.nombre}</p>
                        <p className="text-sm text-gray-600">{op.descripcion}</p>
                        {op.precio && (
                          <p className="text-lg font-bold text-orange-600 mt-2">
                            ${Number(op.precio).toFixed(2)}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              
              <button
                onClick={confirmarPedido}
                disabled={!selectedMenuOption || submitting}
                className="w-full bg-orange-600 text-white py-4 rounded-lg font-bold hover:bg-orange-700 disabled:opacity-50"
              >
                {submitting ? 'Guardando...' : 'Confirmar Pedido'}
              </button>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-12">
              No hay menús disponibles
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardTrabajadorMejorado;
