import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost/restaurante/backend/api';

export default function MenusSection({ user = null }) {
  const [menus, setMenus] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState(user?.empresa_id ?? '');
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [menuForm, setMenuForm] = useState({
    id: null, nombre: '', descripcion: '', empresa_id: user?.empresa_id || '',
    opciones: [
      { opcion_id: null, nombre: '', descripcion: '', precio: '' },
      { opcion_id: null, nombre: '', descripcion: '', precio: '' },
      { opcion_id: null, nombre: '', descripcion: '', precio: '' }
    ]
  });
  const [showMenuDeleteModal, setShowMenuDeleteModal] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState(null);
  const [copyTargets, setCopyTargets] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  useEffect(() => {
    cargarEmpresas();
    // cargar menus inicial
    const id = user?.empresa_id ? Number(user.empresa_id) : null;
    setSelectedEmpresaId(id);
    cargarMenus(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const showToast = (message, type = 'info', ms = 3000) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), ms);
  };

  const intval = v => parseInt(v, 10) || 0;

  const cargarEmpresas = async () => {
    try {
      const res = await fetch(`${API_BASE}/empresas.php`);
      const txt = await res.text();
      const data = JSON.parse(txt.replace(/^\uFEFF/, '').trim());
      setEmpresas(data.empresas || []);
    } catch (err) {
      console.error('Error cargar empresas', err);
      showToast('Error al cargar empresas', 'error');
    }
  };

  const cargarMenus = async (empresa_id = null) => {
    try {
      const url = empresa_id ? `${API_BASE}/menus.php?empresa_id=${empresa_id}` : `${API_BASE}/menus.php`;
      const res = await fetch(url);
      const txt = await res.text();
      const data = JSON.parse(txt.replace(/^\uFEFF/, '').trim());
      setMenus(data.menus || []);
    } catch (err) {
      console.error('Error cargar menus:', err);
      showToast('Error al cargar menús', 'error');
    }
  };

  const openCreateMenuModal = () => {
    setMenuForm({
      id: null,
      nombre: '',
      descripcion: '',
      empresa_id: selectedEmpresaId || '',
      opciones: [
        { opcion_id: null, nombre: '', descripcion: '', precio: '' },
        { opcion_id: null, nombre: '', descripcion: '', precio: '' },
        { opcion_id: null, nombre: '', descripcion: '', precio: '' }
      ]
    });
    setShowMenuModal(true);
  };

  const openEditMenuModal = (menu) => {
    const opciones = [1,2,3].map(i => {
      const o = (menu.opciones || []).find(x => Number(x.idx) === i) || {};
      return {
        opcion_id: o.opcion_id || null,
        nombre: o.nombre || '',
        descripcion: o.descripcion || '',
        precio: o.precio !== undefined && o.precio !== null ? o.precio : ''
      };
    });
    setMenuForm({
      id: menu.id,
      nombre: menu.nombre || '',
      descripcion: menu.descripcion || '',
      empresa_id: menu.empresa_id || selectedEmpresaId || '',
      opciones
    });
    setShowMenuModal(true);
  };

  const handleMenuSave = async () => {
    if (!menuForm.nombre || !menuForm.empresa_id || !Array.isArray(menuForm.opciones) || menuForm.opciones.length !== 3) {
      showToast('Completa nombre, empresa y 3 opciones', 'warning');
      return;
    }

    const method = menuForm.id ? 'PUT' : 'POST';
    const payload = {
      ...(menuForm.id && { id: Number(menuForm.id) }),
      nombre: menuForm.nombre,
      descripcion: menuForm.descripcion,
      empresa_id: Number(menuForm.empresa_id),
      opciones: menuForm.opciones.map(o => ({
        opcion_id: o.opcion_id ? Number(o.opcion_id) : null,
        nombre: o.nombre,
        descripcion: o.descripcion,
        precio: o.precio !== '' ? Number(o.precio) : 0
      }))
    };

    try {
      const res = await fetch(`${API_BASE}/menus.php`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const txt = await res.text();
      const data = (() => { try { return JSON.parse(txt.replace(/^\uFEFF/, '').trim()); } catch { return { raw: txt }; } })();

      if (res.ok) {
        showToast(data.mensaje || 'Menú guardado', 'success');
        setShowMenuModal(false);
        await cargarMenus(Number(payload.empresa_id));
      } else {
        console.error('Error guardar menú:', data);
        showToast(data.error || 'Error al guardar', 'error');
      }
    } catch (err) {
      console.error('Exception handleMenuSave:', err);
      showToast('Error de red', 'error');
    }
  };

  const confirmDeleteMenu = (menu) => {
    setMenuToDelete(menu);
    setShowMenuDeleteModal(true);
  };

  const handleMenuDelete = async () => {
    if (!menuToDelete || !menuToDelete.id) {
      showToast('Menú inválido', 'warning');
      return;
    }
    const id = Number(menuToDelete.id);
    try {
      const res = await fetch(`${API_BASE}/menus.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const txt = await res.text();
      const data = (() => { try { return JSON.parse(txt.replace(/^\uFEFF/, '').trim()); } catch { return { raw: txt }; } })();
      if (res.ok) {
        showToast(data.mensaje || 'Menú eliminado', 'success');
        setShowMenuDeleteModal(false);
        setMenuToDelete(null);
        await cargarMenus(selectedEmpresaId);
      } else {
        console.error('Error eliminar menú:', data);
        showToast(data.error || 'Error al eliminar', 'error');
      }
    } catch (err) {
      console.error('Exception handleMenuDelete:', err);
      showToast('Error de red', 'error');
    }
  };

  const copyMenu = async (menuId, targetEmpresaId) => {
    const mId = Number(menuId);
    const tId = Number(targetEmpresaId);
    if (!mId || !tId) { showToast('Empresa destino inválida', 'warning'); return; }
    setCopyTargets(prev => ({ ...prev, [mId]: 'loading' }));
    try {
      const res = await fetch(`${API_BASE}/menus.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'copy', menu_id: mId, target_empresa_id: tId })
      });
      const txt = await res.text();
      const data = (() => { try { return JSON.parse(txt.replace(/^\uFEFF/, '').trim()); } catch { return { raw: txt }; } })();
      if (res.ok) {
        showToast(data.mensaje || 'Menú copiado', 'success');
        await cargarMenus(selectedEmpresaId);
      } else {
        console.error('Error copiar menú:', data);
        showToast(data.error || 'Error al copiar', 'error');
      }
    } catch (err) {
      console.error('Exception copyMenu:', err);
      showToast('Error de red', 'error');
    } finally {
      setCopyTargets(prev => ({ ...prev, [mId]: null }));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">🍽️ Gestión de Menús</h2>
        <div className="flex items-center gap-3">
          <select
            className="border border-gray-300 p-2 rounded-md"
            value={selectedEmpresaId || ''}
            onChange={e => {
              const val = e.target.value || null;
              setSelectedEmpresaId(val);
              cargarMenus(val);
            }}
          >
            <option value="">-- Todas las empresas --</option>
            {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
          </select>
          <button onClick={openCreateMenuModal} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
            ➕ Crear Menú
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {menus.length === 0 ? (
          <p className="text-gray-500">No hay menús</p>
        ) : (
          menus.map(menu => (
            <div key={menu.id} className="border rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-lg">{menu.nombre}</div>
                  <div className="text-sm text-gray-600 mb-2">{menu.descripcion}</div>
                  <ul className="space-y-1">
                    {menu.opciones?.map((o, i) => (
                      <li key={i} className="text-sm">
                        <span className="font-medium">{o.nombre || `Opción ${i+1}`}</span>
                        <span className="text-gray-500"> — {o.descripcion || 'sin descripción'}</span>
                        <span className="ml-2 text-gray-700">{o.precio !== null && o.precio !== undefined ? `$${Number(o.precio).toFixed(2)}` : 'sin precio'}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <button className="px-3 py-1 rounded bg-blue-600 text-white text-sm" onClick={() => openEditMenuModal(menu)}>✏️ Editar</button>
                    <button className="px-3 py-1 rounded bg-red-600 text-white text-sm" onClick={() => confirmDeleteMenu(menu)}>🗑️ Eliminar</button>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      defaultValue=""
                      onChange={(e) => {
                        const target = e.target.value;
                        if (!target) return;
                        copyMenu(menu.id, target);
                        e.target.value = '';
                      }}
                      disabled={copyTargets[menu.id] === 'loading'}
                    >
                      <option value="">Copiar a...</option>
                      {empresas.filter(en => String(en.id) !== String(menu.empresa_id)).map(en => (
                        <option key={en.id} value={en.id}>{en.nombre}</option>
                      ))}
                    </select>
                    {copyTargets[menu.id] === 'loading' && <span className="text-sm text-gray-600">Copiando…</span>}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Menu Modal */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">{menuForm.id ? 'Editar Menú' : 'Crear Menú'}</h3>
            <div className="space-y-3">
              <input className="w-full border p-2 rounded" placeholder="Nombre" value={menuForm.nombre} onChange={e => setMenuForm(f => ({ ...f, nombre: e.target.value }))} />
              <textarea className="w-full border p-2 rounded" placeholder="Descripción" value={menuForm.descripcion} onChange={e => setMenuForm(f => ({ ...f, descripcion: e.target.value }))} />
              <div className="grid grid-cols-3 gap-4">
                {menuForm.opciones.map((op, idx) => (
                  <div key={idx} className="p-3 border rounded bg-gray-50">
                    <label className="text-xs font-semibold block mb-1">Opción {String.fromCharCode(65 + idx)}</label>
                    <input className="w-full border p-2 rounded mb-1 text-sm" placeholder="Nombre" value={op.nombre} onChange={e => { const c = [...menuForm.opciones]; c[idx].nombre = e.target.value; setMenuForm(f => ({ ...f, opciones: c })); }} />
                    <input className="w-full border p-2 rounded mb-1 text-sm" placeholder="Descripción" value={op.descripcion} onChange={e => { const c = [...menuForm.opciones]; c[idx].descripcion = e.target.value; setMenuForm(f => ({ ...f, opciones: c })); }} />
                    <input type="number" step="0.01" className="w-full border p-2 rounded text-sm" placeholder="Precio" value={op.precio} onChange={e => { const c = [...menuForm.opciones]; c[idx].precio = e.target.value; setMenuForm(f => ({ ...f, opciones: c })); }} />
                  </div>
                ))}
              </div>

              {!menuForm.id && (
                <select className="w-full border p-2 rounded" value={menuForm.empresa_id || ''} onChange={e => setMenuForm(f => ({ ...f, empresa_id: e.target.value }))}>
                  <option value="">-- Selecciona Empresa --</option>
                  {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
                </select>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setShowMenuModal(false)}>Cancelar</button>
              <button className="px-4 py-2 bg-purple-600 text-white rounded" onClick={handleMenuSave}>{menuForm.id ? 'Guardar Cambios' : 'Crear Menú'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Menu Modal */}
      {showMenuDeleteModal && menuToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">Confirmar eliminación</h3>
            <p className="text-sm text-gray-600 mb-4">¿Eliminar el menú <strong>{menuToDelete.nombre}</strong>? Se eliminarán sus opciones y precios.</p>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => { setShowMenuDeleteModal(false); setMenuToDelete(null); }}>Cancelar</button>
              <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={handleMenuDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Simple toast */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 px-4 py-2 rounded shadow ${toast.type === 'error' ? 'bg-red-600 text-white' : toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-gray-800 text-white'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}