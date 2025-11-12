import React, { useState, useEffect } from 'react';
import MenusSection from './components/MenusSection';
import RecepcionPedidos from './components/RecepcionPedidos';

const API_BASE = 'http://localhost/restaurante/backend/api';

function DashboardAdministrador({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [nuevaIdentificacion, setNuevaIdentificacion] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevoPassword, setNuevoPassword] = useState("");
  const [nuevoPerfil, setNuevoPerfil] = useState("trabajador");
  const [selectedEmpresaId, setSelectedEmpresaId] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [empresaForm, setEmpresaForm] = useState({ id: null, nombre: '' });

  // Menús
  const [menus, setMenus] = useState([]);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [menuForm, setMenuForm] = useState({
    id: null,
    nombre: '',
    descripcion: '',
    opciones: [
      { opcion_id: null, nombre: '', descripcion: '', precio: '' },
      { opcion_id: null, nombre: '', descripcion: '', precio: '' },
      { opcion_id: null, nombre: '', descripcion: '', precio: '' }
    ],
    empresa_id: '',
    fecha_publicacion: new Date().toISOString().slice(0,10)
  });
  const [showMenuDeleteModal, setShowMenuDeleteModal] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState(null);

  // Estados para modales y toasts (usuarios ya usan)
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [editForm, setEditForm] = useState({ id: "", nombre: "", email: "", perfil: "", password: "" });
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const showToast = (message, type = "info", ms = 3000) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), ms);
  };

  // Nueva estado para copiar menús
  const [copyTargets, setCopyTargets] = useState({});

  // Cargas iniciales
  useEffect(() => { if (activeTab === "usuarios") cargarUsuarios(); }, [activeTab]);
  useEffect(() => { cargarEmpresas(); }, []);
  useEffect(() => { setMenuForm(f => ({ ...f, empresa_id: selectedEmpresaId || '' })); }, [selectedEmpresaId]);

  const cargarEmpresas = async () => {
    try {
      const res = await fetch("http://localhost/restaurante/backend/api/empresas.php");
      const txt = await res.text();
      const data = JSON.parse(txt.replace(/^\uFEFF/, '').trim());
      setEmpresas(data.empresas || []);
    } catch (err) {
      console.error("Error al cargar empresas:", err);
      showToast("No se pudieron cargar las empresas", "error");
    }
  };

  const cargarUsuarios = async () => {
    try {
      const res = await fetch("http://localhost/restaurante/backend/api/usuarios.php");
      const data = await res.json();
      setUsuarios(data.usuarios || []);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      showToast("Error al cargar usuarios", "error");
    }
  };

  // Menús: cargar (filtrado por empresa)
  const cargarMenus = async (empresa_id = null) => {
    try {
      const url = empresa_id ? `${API_BASE}/menus.php?empresa_id=${empresa_id}` : `${API_BASE}/menus.php`;
      const res = await fetch(url);
      const txt = await res.text();
      const data = JSON.parse(txt.replace(/^\uFEFF/, '').trim());
      setMenus(data.menus || []);
    } catch (err) {
      console.error("Error cargar menus:", err);
      showToast("Error al cargar menús", "error");
    }
  };

  // Abrir modal para editar usuario
  const openEditModal = (usuario) => {
    setEditForm({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      perfil: usuario.perfil,
      password: ''
    });
    setShowEditModal(true);
  };

  // Abrir modal para confirmar eliminación de usuario
  const openDeleteModal = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setShowDeleteModal(true);
  };

  // Abrir modal para editar menú
  const openEditMenuModal = (menu) => {
    const opciones = [null, null, null].map((_, i) => {
      const o = (menu.opciones || []).find(x => x.idx === i+1) || {};
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
      opciones,
      empresa_id: menu.empresa_id || selectedEmpresaId || '',
      fecha_publicacion: new Date().toISOString().slice(0,10)
    });
    setShowMenuModal(true);
  };

  // Abrir modal para crear nuevo menú
  const openCreateMenuModal = () => {
    setMenuForm({
      id: null,
      nombre: '',
      descripcion: '',
      opciones: [
        { opcion_id: null, nombre: '', descripcion: '', precio: '' },
        { opcion_id: null, nombre: '', descripcion: '', precio: '' },
        { opcion_id: null, nombre: '', descripcion: '', precio: '' }
      ],
      empresa_id: selectedEmpresaId || '',
      fecha_publicacion: new Date().toISOString().slice(0,10)
    });
    setShowMenuModal(true);
  };

  // Guardar (crear o actualizar)
  const handleMenuSave = async () => {
    if (!menuForm.nombre || !menuForm.empresa_id || menuForm.opciones.some(o => !o.nombre || o.precio === '')) {
      showToast("Completa todos los campos", "warning");
      return;
    }

    try {
      const url = `${API_BASE}/menus.php`;
      const method = menuForm.id ? 'PUT' : 'POST';
      
      const payload = {
        ...(menuForm.id && { id: menuForm.id }),
        nombre: menuForm.nombre,
        descripcion: menuForm.descripcion,
        empresa_id: Number(menuForm.empresa_id),
        opciones: menuForm.opciones.map(o => ({
          opcion_id: o.opcion_id ? Number(o.opcion_id) : null,
          nombre: o.nombre,
          descripcion: o.descripcion,
          precio: o.precio ? Number(o.precio) : 0
        }))
      };

      console.log("Enviando payload:", { method, payload }); // debug

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const txt = await res.text();
      const data = JSON.parse(txt.replace(/^\uFEFF/, '').trim());
      
      if (res.ok) {
        showToast(data.mensaje || "Menú guardado", "success");
        setShowMenuModal(false);
        setMenuForm({
          id: null,
          nombre: '',
          descripcion: '',
          opciones: [
            { opcion_id: null, nombre: '', descripcion: '', precio: '' },
            { opcion_id: null, nombre: '', descripcion: '', precio: '' },
            { opcion_id: null, nombre: '', descripcion: '', precio: '' }
          ],
          empresa_id: '',
          fecha_publicacion: new Date().toISOString().slice(0,10)
        });
        await cargarMenus(payload.empresa_id);
      } else {
        console.error('Error guardar menú:', data);
        showToast(data.error || "Error", "error");
      }
    } catch (err) {
      console.error("Exception handleMenuSave:", err);
      showToast("Error: " + err.message, "error");
    }
  };

  // auxiliar
  const intval = (val) => parseInt(val, 10) || 0;

  // Confirmar eliminación
  const confirmDeleteMenu = (menu) => {
    setMenuToDelete(menu || null);
    setShowMenuDeleteModal(true);
  };

  // Eliminar menú (DELETE con body JSON)
  const handleMenuDelete = async () => {
    if (!menuToDelete || !menuToDelete.id) {
      showToast("No se indicó el menú a eliminar", "warning");
      return;
    }
    const id = Number(menuToDelete.id);
    if (!id) {
      showToast("ID de menú inválido", "warning");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/menus.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      const txt = await res.text();
      let data = {};
      try { data = JSON.parse(txt.replace(/^\uFEFF/, '').trim()); } catch (e) { data = { raw: txt }; }

      if (res.ok) {
        showToast(data.mensaje || "Menú eliminado", "success");
        setShowMenuDeleteModal(false);
        setMenuToDelete(null);
        await cargarMenus(selectedEmpresaId);
      } else {
        console.error("Error eliminar menú:", data);
        showToast(data.error || JSON.stringify(data) || "Error al eliminar", "error");
      }
    } catch (err) {
      console.error("Exception eliminar menú:", err);
      showToast("Error: " + err.message, "error");
    }
  };

  // Copiar menú (POST action: copy) — envía numeros y maneja estado
  const copyMenu = async (menuId, targetEmpresaId) => {
    const mId = Number(menuId);
    const tId = Number(targetEmpresaId);
    
    if (!mId || !tId) {
      showToast("Selecciona una empresa destino válida", "warning");
      return;
    }

    setCopyTargets(prev => ({ ...prev, [mId]: 'loading' }));
    
    try {
      const payload = {
        action: 'copy',
        menu_id: mId,
        target_empresa_id: tId
      };

      console.log("Enviando copia:", payload); // debug

      const res = await fetch(`${API_BASE}/menus.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const txt = await res.text();
      console.log("Respuesta copia raw:", txt); // debug
      
      let data = {};
      try { 
        data = JSON.parse(txt.replace(/^\uFEFF/, '').trim()); 
      } catch (e) { 
        console.error("Error parsear JSON copia:", e);
        data = { raw: txt }; 
      }

      if (res.ok) {
        showToast(data.mensaje || "Menú copiado correctamente", "success");
        await cargarMenus(selectedEmpresaId);
      } else {
        console.error("Error copiar menú (respuesta):", data);
        showToast(data.error || JSON.stringify(data) || "Error al copiar", "error");
      }
    } catch (err) {
      console.error("Exception copyMenu:", err);
      showToast("Error: " + err.message, "error");
    } finally {
      setCopyTargets(prev => ({ ...prev, [mId]: null }));
    }
  };

  // Publicar / despublicar menú para una fecha (un solo menú por empresa y fecha)
  const publishMenu = async (menuId, empresaId, fecha) => {
    try {
      const res = await fetch("http://localhost/restaurante/backend/api/menus.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", menu_id: Number(menuId), empresa_id: Number(empresaId), fecha })
      });
      const txt = await res.text();
      const data = JSON.parse(txt.replace(/^\uFEFF/,'').trim());
      if (!res.ok) { showToast(data.error || 'Error publicando', 'error'); return; }
      showToast('Menú publicado para ' + fecha, 'success');
      cargarMenus(selectedEmpresaId);
    } catch (err) {
      console.error('Error publicar menú', err);
      showToast('Error de conexión', 'error');
    }
  };

  const unpublishMenuForDate = async (empresaId, fecha) => {
    try {
      const res = await fetch("http://localhost/restaurante/backend/api/menus.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unpublish", empresa_id: Number(empresaId), fecha })
      });
      const txt = await res.text();
      const data = JSON.parse(txt.replace(/^\uFEFF/,'').trim());
      if (!res.ok) { showToast(data.error || 'Error al despublicar', 'error'); return; }
      showToast('Menú despublicado para ' + fecha, 'success');
      cargarMenus(selectedEmpresaId);
    } catch (err) {
      console.error('Error despublicar', err);
      showToast('Error de conexión', 'error');
    }
  };

  // Usuarios / empresas CRUD (mantener funciones existentes)
  const crearUsuario = async () => {
    if (!nuevaIdentificacion || !nuevoNombre || !nuevoEmail || !nuevoPassword) {
      showToast("Completa todos los campos", "warning");
      return;
    }
    const payload = {
      identificacion: nuevaIdentificacion,
      nombre: nuevoNombre,
      email: nuevoEmail,
      password: nuevoPassword,
      perfil: nuevoPerfil,
    };
    if (nuevoPerfil === 'trabajador') payload.empresa_id = selectedEmpresaId;

    try {
      const res = await fetch("http://localhost/restaurante/backend/api/usuarios.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      const cleaned = text.replace(/^\uFEFF/, '').trim();
      let data;
      try { data = JSON.parse(cleaned); } catch (parseErr) { showToast("Respuesta inválida del servidor.", "error"); return; }
      if (!res.ok) { showToast(data.error || "Error al crear usuario", "error"); return; }
      showToast("Usuario creado correctamente", "success");
      setNuevaIdentificacion(""); setNuevoNombre(""); setNuevoEmail(""); setNuevoPassword(""); setNuevoPerfil("trabajador"); setSelectedEmpresaId(null);
      cargarUsuarios();
    } catch (error) {
      console.error("Error al crear usuario:", error);
      showToast("Error de conexión", "error");
    }
  };

  const handleEditSave = async () => {
    if (!editForm.nombre || !editForm.email || !editForm.perfil) { showToast("Completa todos los campos", "warning"); return; }
    try {
      const res = await fetch("http://localhost/restaurante/backend/api/usuarios.php", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const text = await res.text();
      const cleaned = text.replace(/^\uFEFF/, '').trim();
      let data;
      try { data = JSON.parse(cleaned); } catch { showToast("Respuesta inválida del servidor al editar", "error"); return; }
      if (!res.ok) { showToast(data.error || "Error al editar usuario", "error"); return; }
      showToast(data.mensaje || "Usuario actualizado correctamente", "success");
      setShowEditModal(false); cargarUsuarios();
    } catch (error) {
      console.error("Error al editar usuario:", error);
      showToast("Error de conexión", "error");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!usuarioSeleccionado) return;
    try {
      const res = await fetch("http://localhost/restaurante/backend/api/usuarios.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: usuarioSeleccionado.id }),
      });
      const text = await res.text();
      const cleaned = text.replace(/^\uFEFF/, '').trim();
      let data;
      try { data = JSON.parse(cleaned); } catch { showToast("Respuesta inválida del servidor al eliminar", "error"); return; }
      if (!res.ok) { showToast(data.error || "Error al eliminar usuario", "error"); return; }
      showToast(data.mensaje || "Usuario eliminado correctamente", "success");
      setShowDeleteModal(false); setUsuarioSeleccionado(null); cargarUsuarios();
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      showToast("Error de conexión", "error");
    }
  };

  // Empresas CRUD
  const crearEmpresa = async () => {
    if (!empresaForm.nombre || empresaForm.nombre.trim() === '') { showToast("Ingresa el nombre de la empresa", "warning"); return; }
    try {
      const res = await fetch("http://localhost/restaurante/backend/api/empresas.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: empresaForm.nombre.trim() })
      });
      const text = await res.text();
      const data = JSON.parse(text.replace(/^\uFEFF/,'').trim());
      if (!res.ok) { showToast(data.error || "Error al crear empresa", "error"); return; }
      showToast("Empresa creada", "success");
      setEmpresaForm({ id: null, nombre: '' });
      cargarEmpresas();
    } catch (err) { console.error("Error crear empresa:", err); showToast("Error de conexión", "error"); }
  };
  const openEmpresaEdit = (e) => setEmpresaForm({ id: e.id, nombre: e.nombre });
  const guardarEmpresa = async () => {
    if (!empresaForm.id) return crearEmpresa();
    try {
      const res = await fetch("http://localhost/restaurante/backend/api/empresas.php", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(empresaForm)
      });
      const text = await res.text();
      const data = JSON.parse(text.replace(/^\uFEFF/,'').trim());
      if (!res.ok) { showToast(data.error || "Error al actualizar empresa", "error"); return; }
      showToast("Empresa actualizada", "success"); setEmpresaForm({ id: null, nombre: '' }); cargarEmpresas();
    } catch (err) { console.error("Error actualizar empresa:", err); showToast("Error de conexión", "error"); }
  };
  const eliminarEmpresa = async (id) => {
    try {
      const res = await fetch("http://localhost/restaurante/backend/api/empresas.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const text = await res.text();
      const data = JSON.parse(text.replace(/^\uFEFF/,'').trim());
      if (!res.ok) { showToast(data.error || "Error al eliminar empresa", "error"); return; }
      showToast("Empresa eliminada", "success"); setEmpresas(prev => prev.filter(p => p.id !== id));
      if (selectedEmpresaId === id) setSelectedEmpresaId(null);
    } catch (err) { console.error("Error eliminar empresa:", err); showToast("Error de conexión", "error"); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      <div className="fixed top-6 right-6 z-50">
        {toast.show && (
          <div
            className={`max-w-sm px-4 py-3 rounded-lg shadow-lg text-white transition-opacity ${
              toast.type === "success" ? "bg-green-600" :
              toast.type === "error" ? "bg-red-600" :
              toast.type === "warning" ? "bg-yellow-600 text-black" :
              "bg-blue-600"
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>

      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">👨‍💼 Panel Administrador</h1>
              <p className="text-sm text-purple-100">{user.nombre}</p>
            </div>
            <button 
              onClick={onLogout} 
              className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
            >
              🚪 Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="flex border-b overflow-x-auto">
            {['usuarios', 'menus', 'pedidos', 'estadisticas', 'empresas'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-semibold capitalize ${
                  activeTab === tab 
                    ? 'border-b-2 border-purple-600 text-purple-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab: Menús */}
        {activeTab === 'menus' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <MenusSection user={user} />
          </div>
        )}

        {/* Tab: Usuarios */}
        {activeTab === 'usuarios' && (
          <div className="grid gap-4">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">👥 Gestión de Usuarios</h2>

              {/* Formulario crear usuario */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-6">
                <input
                  type="text"
                  placeholder="Identificación"
                  className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={nuevaIdentificacion}
                  onChange={(e) => setNuevaIdentificacion(e.target.value)}
                  autoComplete="off"
                />
                <input
                  type="text"
                  placeholder="Nombre completo"
                  className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  autoComplete="off"
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  autoComplete="off"
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={nuevoPassword}
                  onChange={(e) => setNuevoPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <select
                  className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={nuevoPerfil}
                  onChange={(e) => setNuevoPerfil(e.target.value)}
                >
                  <option value="trabajador">Trabajador</option>
                  <option value="vendedor">Vendedor</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="administrador">Administrador</option>
                </select>

                {nuevoPerfil === 'trabajador' && (
                  <select
                    className="border border-gray-300 p-2 rounded-md"
                    value={selectedEmpresaId || ''}
                    onChange={e => setSelectedEmpresaId(e.target.value)}
                  >
                    <option value="">-- Empresa (obligatorio) --</option>
                    {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
                  </select>
                )}
                <button
                  onClick={crearUsuario}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-semibold transition-colors"
                >
                  ➕ Crear
                </button>
              </div>

              {/* Lista de usuarios */}
              <div className="space-y-2">
                {usuarios.length > 0 ? (
                  usuarios.map((u) => (
                    <div
                      key={u.id}
                      className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">
                          <span className="inline-block px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700 mr-2">
                            {u.perfil}
                          </span>
                          {u.nombre}
                        </p>
                        <p className="text-sm text-gray-500">
                          ID: {u.identificacion} | {u.email} {u.empresa_id ? `| Empresa: ${u.empresa_id}` : ''}
                        </p>
                      </div>
                      <div className="space-x-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => openDeleteModal(u)}
                          className="text-red-600 hover:text-red-800 font-semibold"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No hay usuarios registrados. Crea el primer usuario.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Pedidos */}
        {activeTab === 'pedidos' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <RecepcionPedidos user={user} />
          </div>
        )}

        {/* Tab: Estadísticas */}
        {activeTab === 'estadisticas' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">📊 Dashboard y Estadísticas</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Menú más pedido</h3>
                <p className="text-2xl font-bold text-blue-600">Opción A - 40%</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Total pedidos hoy</h3>
                <p className="text-2xl font-bold text-green-600">100</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Empresas */}
        {activeTab === 'empresas' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">🏢 Empresas</h2>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-2">
              <input type="text" placeholder="Nombre de la empresa" className="border p-2 rounded" value={empresaForm.nombre} onChange={e => setEmpresaForm(f => ({ ...f, nombre: e.target.value }))} />
              <div className="flex gap-2">
                <button onClick={guardarEmpresa} className="bg-purple-600 text-white px-4 py-2 rounded">{empresaForm.id ? 'Guardar' : 'Crear'}</button>
                <button onClick={() => setEmpresaForm({ id: null, nombre: '' })} className="bg-gray-200 px-4 py-2 rounded">Limpiar</button>
              </div>
            </div>
            <div className="space-y-2">
              {empresas.length > 0 ? empresas.map(e => (
                <div key={e.id} className="flex justify-between items-center p-3 border rounded">
                  <div>{e.nombre}</div>
                  <div className="flex gap-2">
                    <button onClick={() => openEmpresaEdit(e)} className="text-blue-600">✏️</button>
                    <button onClick={() => eliminarEmpresa(e.id)} className="text-red-600">🗑️</button>
                  </div>
                </div>
              )) : (<p className="text-gray-500">No hay empresas registradas.</p>)}
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Editar usuario</h3>
            <div className="space-y-3">
              <input className="w-full border p-2 rounded" value={editForm.nombre} onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre" />
              <input className="w-full border p-2 rounded" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" />
              <select className="w-full border p-2 rounded" value={editForm.perfil} onChange={e => setEditForm(f => ({ ...f, perfil: e.target.value }))}>
                <option value="trabajador">Trabajador</option>
                <option value="vendedor">Vendedor</option>
                <option value="supervisor">Supervisor</option>
                <option value="administrador">Administrador</option>
              </select>
              <input className="w-full border p-2 rounded" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} placeholder="Nueva contraseña (opcional)" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowEditModal(false)}>Cancelar</button>
              <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={handleEditSave}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && usuarioSeleccionado && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">Confirmar eliminación</h3>
            <p className="text-sm text-gray-600 mb-4">¿Eliminar a <strong>{usuarioSeleccionado.nombre}</strong> (ID: {usuarioSeleccionado.identificacion})?</p>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={handleDeleteConfirm}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Menu Modal */}
      {showMenuDeleteModal && menuToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">Confirmar eliminación</h3>
            <p className="text-sm text-gray-600 mb-4">
              ¿Eliminar el menú <strong>{menuToDelete.nombre}</strong>? Se eliminarán todas sus opciones y precios.
            </p>
            <div className="flex justify-end gap-2">
              <button 
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition" 
                onClick={() => { 
                  setShowMenuDeleteModal(false); 
                  setMenuToDelete(null); 
                }}
              >
                Cancelar
              </button>
              <button 
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition font-semibold" 
                onClick={handleMenuDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Menu Modal */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">{menuForm.id ? 'Editar Menú' : 'Crear Menú'}</h3>
            <div className="space-y-3">
              <input 
                className="w-full border p-2 rounded" 
                placeholder="Nombre del menú" 
                value={menuForm.nombre} 
                onChange={e => setMenuForm(f => ({ ...f, nombre: e.target.value }))} 
              />
              <textarea 
                className="w-full border p-2 rounded" 
                placeholder="Descripción general" 
                value={menuForm.descripcion} 
                onChange={e => setMenuForm(f => ({ ...f, descripcion: e.target.value }))} 
              />
              
              <div className="grid grid-cols-3 gap-4">
                {menuForm.opciones.map((op, idx) => (
                  <div key={idx} className="p-3 border rounded bg-gray-50">
                    <label className="text-xs font-semibold text-gray-700 block mb-2">
                      Opción {String.fromCharCode(65 + idx)}
                    </label>
                    <input 
                      className="w-full border p-2 rounded mb-1 text-sm" 
                      placeholder="Nombre" 
                      value={op.nombre} 
                      onChange={e => {
                        const copy = [...menuForm.opciones]; 
                        copy[idx].nombre = e.target.value; 
                        setMenuForm(f => ({ ...f, opciones: copy }));
                      }} 
                    />
                    <input 
                      className="w-full border p-2 rounded mb-1 text-sm" 
                      placeholder="Descripción" 
                      value={op.descripcion} 
                      onChange={e => {
                        const copy = [...menuForm.opciones]; 
                        copy[idx].descripcion = e.target.value; 
                        setMenuForm(f => ({ ...f, opciones: copy }));
                      }} 
                    />
                    <input 
                      type="number" 
                      step="0.01" 
                      className="w-full border p-2 rounded text-sm" 
                      placeholder="Precio" 
                      value={op.precio} 
                      onChange={e => {
                        const copy = [...menuForm.opciones]; 
                        copy[idx].precio = e.target.value; 
                        setMenuForm(f => ({ ...f, opciones: copy }));
                      }} 
                    />
                  </div>
                ))}
              </div>

              {!menuForm.id && (
                <select 
                  className="w-full border p-2 rounded" 
                  value={menuForm.empresa_id || ''} 
                  onChange={e => setMenuForm(f => ({ ...f, empresa_id: e.target.value }))}
                >
                  <option value="">-- Selecciona Empresa --</option>
                  {empresas.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button 
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition" 
                onClick={() => setShowMenuModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded transition font-semibold" 
                onClick={handleMenuSave}
              >
                {menuForm.id ? 'Guardar Cambios' : 'Crear Menú'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardAdministrador;