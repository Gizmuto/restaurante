import React, { useState } from 'react';

export default function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    identificacion: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.identificacion || !formData.password) {
      setError('Por favor complete todos los campos');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost/restaurante/backend/api/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          identificacion: String(formData.identificacion),
          password: formData.password
        })
      });

      // Obtener el texto de la respuesta primero
      const text = await response.text();
      
      // Intentar parsear como JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Error al parsear JSON:', text);
        setError('Error del servidor. Respuesta inválida.');
        setLoading(false);
        return;
      }

      // Si la respuesta es exitosa
      if (response.ok && data.ok) {
        setSuccess(true);
        
        // Guardar token, usuario y admin_id en localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('admin_id', data.admin_id || data.user.id);
        
        console.log('✅ Login exitoso:', data);
        
        // Llamar callback después de un breve delay
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(data.user);
          }
        }, 800);
        
      } else {
        // Manejar errores específicos
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.error('Error de conexión:', err);
      setError('No se pudo conectar con el servidor. Verifica que Apache/PHP esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-4xl">
              🔐
            </div>
            <h1 className="text-2xl font-bold mb-2">Iniciar Sesión</h1>
            <p className="text-blue-100 text-sm">Restaurante Comer Bien</p>
          </div>

          {/* Form */}
          <div className="p-8">
            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-shake">
                <span className="text-red-600 text-xl flex-shrink-0">⚠️</span>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <span className="text-green-600 text-xl flex-shrink-0">✓</span>
                <p className="text-green-800 text-sm font-semibold">¡Login exitoso! Redirigiendo...</p>
              </div>
            )}

            {/* Campo IDENTIFICACION */}
            <div className="mb-6">
              <label htmlFor="identificacion" className="block text-gray-700 text-sm font-semibold mb-2">
                Identificación
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">👤</span>
                <input
                  type="text"
                  id="identificacion"
                  name="identificacion"
                  value={formData.identificacion}
                  onChange={handleChange}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ingresa tu identificacion"
                  disabled={loading || success}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Campo Password */}
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🔒</span>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ingresa tu contraseña"
                  disabled={loading || success}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Botón Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || success}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Iniciando sesión...
                </>
              ) : success ? (
                <>
                  <span className="text-xl">✓</span>
                  ¡Éxito!
                </>
              ) : (
                <>
                  <span className="text-xl">🚀</span>
                  Iniciar Sesión
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Restaurante Comer Bien - {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}