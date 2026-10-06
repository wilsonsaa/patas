import React, { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import MascotaCard from './MascotaCard';
import { Search, Filter, PawPrint, PlusCircle, Sparkles, RefreshCw } from 'lucide-react';
import { PetSpecies, PetSize, PetAgeCategory } from '../types';

export default function MascotasGallery() {
  const { pets, setModalSubirMascotaAbierto, esGestor } = useTheme();

  const [busqueda, setBusqueda] = useState('');
  const [especieFiltro, setEspecieFiltro] = useState<'todas' | PetSpecies>('todas');
  const [municipioFiltro, setMunicipioFiltro] = useState<string>('todos');
  const [tamanoFiltro, setTamanoFiltro] = useState<string>('todos');
  const [edadFiltro, setEdadFiltro] = useState<string>('todos');

  // Available municipalities extracted dynamically
  const municipiosDisponibles = useMemo(() => {
    const list = Array.from(new Set(pets.map(p => p.municipio)));
    return list;
  }, [pets]);

  // Filtered list
  const mascotasFiltradas = useMemo(() => {
    return pets.filter(p => {
      const matchBusqueda =
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.raza.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(busqueda.toLowerCase());

      const matchEspecie = especieFiltro === 'todas' || p.especie === especieFiltro;
      const matchMunicipio = municipioFiltro === 'todos' || p.municipio === municipioFiltro;
      const matchTamano = tamanoFiltro === 'todos' || p.tamano === tamanoFiltro;
      const matchEdad = edadFiltro === 'todos' || p.edadCategoria === edadFiltro;

      return matchBusqueda && matchEspecie && matchMunicipio && matchTamano && matchEdad;
    });
  }, [pets, busqueda, especieFiltro, municipioFiltro, tamanoFiltro, edadFiltro]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setEspecieFiltro('todas');
    setMunicipioFiltro('todos');
    setTamanoFiltro('todos');
    setEdadFiltro('todos');
  };

  return (
    <section id="mascotas" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Header section with title and CTA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 mb-2">
            <PawPrint className="w-3.5 h-3.5" /> Adopta con el Corazón
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 font-heading tracking-tight">
            Mascotas Disponibles para Adopción
          </h2>
          <p className="text-gray-500 font-medium text-sm sm:text-base mt-1">
            Cada uno de ellos espera un hogar para toda la vida. Conoce su historia y postúlate.
          </p>
        </div>

        {esGestor && (
        <button
          id="btn-subir-mascota-galeria"
          onClick={() => setModalSubirMascotaAbierto(true)}
          className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
          style={{ backgroundColor: 'var(--color-acento)' }}
        >
          <PlusCircle className="w-4 h-4" />
          Publicar mascota rescatada
        </button>
        )}
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-lg shadow-gray-200/50 border border-gray-100 mb-8 space-y-4">
        {/* Search Input & Species Tabs */}
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full lg:max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, raza o personalidad..."
              className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Species tabs */}
          <div className="flex items-center bg-gray-100 p-1 rounded-2xl w-full lg:w-auto overflow-x-auto">
            <button
              onClick={() => setEspecieFiltro('todas')}
              className={`flex-1 lg:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                especieFiltro === 'todas'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🐾 Todos ({pets.length})
            </button>
            <button
              onClick={() => setEspecieFiltro('perro')}
              className={`flex-1 lg:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                especieFiltro === 'perro'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🐶 Perros ({pets.filter(p => p.especie === 'perro').length})
            </button>
            <button
              onClick={() => setEspecieFiltro('gato')}
              className={`flex-1 lg:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                especieFiltro === 'gato'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🐱 Gatos ({pets.filter(p => p.especie === 'gato').length})
            </button>
          </div>
        </div>

        {/* Secondary filters row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-gray-100">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Ubicación en Mosquera
            </label>
            <select
              value={municipioFiltro}
              onChange={(e) => setMunicipioFiltro(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="todos">Todo Mosquera</option>
              {municipiosDisponibles.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Tamaño
            </label>
            <select
              value={tamanoFiltro}
              onChange={(e) => setTamanoFiltro(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="todos">Cualquier tamaño</option>
              <option value="Pequeño">Pequeño (&lt; 10 kg)</option>
              <option value="Mediano">Mediano (10 - 25 kg)</option>
              <option value="Grande">Grande (&gt; 25 kg)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Etapa de Vida
            </label>
            <select
              value={edadFiltro}
              onChange={(e) => setEdadFiltro(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="todos">Todas las edades</option>
              <option value="Cachorro">Cachorro</option>
              <option value="Joven">Joven</option>
              <option value="Adulto">Adulto</option>
              <option value="Senior">Senior (+7 años)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={limpiarFiltros}
              className="w-full text-xs py-2 px-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center gap-1 font-semibold transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Restablecer
            </button>
          </div>
        </div>
      </div>

      {/* Mascotas Grid */}
      {mascotasFiltradas.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mascotasFiltradas.map((mascota) => (
            <MascotaCard key={mascota.id} mascota={mascota} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8">
          <div className="text-5xl mb-3">🐾</div>
          <h3 className="text-xl font-bold text-gray-800 font-heading">
            No se encontraron mascotas con estos filtros
          </h3>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 max-w-md mx-auto">
            Intenta cambiar el municipio o la etapa de vida, o limpia los filtros para ver todos los peluditos disponibles.
          </p>
          <button
            onClick={limpiarFiltros}
            className="mt-4 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 transition-colors"
          >
            Ver todas las mascotas
          </button>
        </div>
      )}
    </section>
  );
}
