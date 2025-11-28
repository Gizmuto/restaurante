import React from 'react';
import { LayoutGrid, Image, FileText, Video, Music } from 'lucide-react';

export default function ResponsiveGrid() {
  const items = [
    { id: 1, title: 'Proyecto 1', description: 'Descripción del primer proyecto', icon: Image, color: 'bg-blue-500' },
    { id: 2, title: 'Proyecto 2', description: 'Descripción del segundo proyecto', icon: FileText, color: 'bg-green-500' },
    { id: 3, title: 'Proyecto 3', description: 'Descripción del tercer proyecto', icon: Video, color: 'bg-purple-500' },
    { id: 4, title: 'Proyecto 4', description: 'Descripción del cuarto proyecto', icon: Music, color: 'bg-orange-500' },
    { id: 5, title: 'Proyecto 5', description: 'Descripción del quinto proyecto', icon: LayoutGrid, color: 'bg-pink-500' },
    { id: 6, title: 'Proyecto 6', description: 'Descripción del sexto proyecto', icon: Image, color: 'bg-teal-500' },
    { id: 7, title: 'Proyecto 7', description: 'Descripción del séptimo proyecto', icon: FileText, color: 'bg-red-500' },
    { id: 8, title: 'Proyecto 8', description: 'Descripción del octavo proyecto', icon: Video, color: 'bg-indigo-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Mi Portfolio
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Explora mis proyectos y trabajos recientes
          </p>
        </header>

        {/* Grid responsivo: 1 col en mobile, 2 en tablet, 3-4 en desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer transform hover:-translate-y-1"
              >
                <div className={`${item.color} h-32 flex items-center justify-center transition-all duration-300 group-hover:h-40`}>
                  <Icon className="w-12 h-12 text-white" />
                </div>
                <div className="p-4 md:p-6">
                  <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm md:text-base">
                    {item.description}
                  </p>
                  <button className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                    Ver más →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sección adicional con grid diferente */}
        <section className="mt-12 md:mt-16">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
            Características Destacadas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <LayoutGrid className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Responsive Design
              </h3>
              <p className="text-gray-600">
                Se adapta perfectamente a cualquier dispositivo y tamaño de pantalla
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Fácil Integración
              </h3>
              <p className="text-gray-600">
                Compatible con tu backend PHP y fácil de personalizar
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Animaciones Suaves
              </h3>
              <p className="text-gray-600">
                Transiciones y efectos hover que mejoran la experiencia
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}