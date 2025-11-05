import React, { useState } from 'react';

export default function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    id: '',
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

    if (!formData.id || !formData.password) {
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
        body: JSON.stringify({
          id: parseInt(formData.id),
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setSuccess(true);
        
        // Guardar datos
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        console.log('Login exitoso:', data);
        
        // Llamar callback
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(data.user);
          }
        }, 500);
        
      } else {
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.error('Error de conexión:', err);
      setError('No se pudo conectar con el servidor');
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
            <p className="text-blue-100 text-sm">Accede a tu cuenta</p>
          </div>

          {/* Form */}
          <div className="p-8">
            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <span className="text-red-600 text-xl">⚠️</span>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <span className="text-green-600 text-xl">✓</span>
                <p className="text-green-800 text-sm">¡Login exitoso! Redirigiendo...</p>
              </div>
            )}

            {/* Campo ID */}
            <div className="mb-6">
              <label htmlFor="id" className="block text-gray-700 text-sm font-semibold mb-2">
                ID de Usuario
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">👤</span>
                <input
                  type="number"
                  id="id"
                  name="id"
                  value={formData.id}
                  onChange={handleChange}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ingresa tu ID"
                  disabled={loading || success}
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
                />
              </div>
            </div>

            {/* Botón Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || success}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

            {/* Info de prueba */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 font-semibold mb-2">📝 Credenciales de prueba:</p>
              <p className="text-xs text-gray-500">ID: <span className="font-mono font-semibold">1</span></p>
              <p className="text-xs text-gray-500">Password: <span className="font-mono font-semibold">Admin123</span></p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          ¿Olvidaste tu contraseña?{' '}
          <button className="text-blue-600 hover:text-blue-800 font-semibold">
            Recuperar acceso
          </button>
        </p>
      </div>
    </div>
  );
}