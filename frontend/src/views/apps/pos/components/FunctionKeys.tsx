import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface FunctionKeysProps {
  onSearch?: (term: string) => void;
  searchTerm?: string;
  onClearCart?: () => void;
}

export const FunctionKeys: React.FC<FunctionKeysProps> = ({ onSearch, searchTerm = '', onClearCart }) => {
  const keys = [
    { label: 'ESPERA', color: 'bg-purple-300' },
    { label: 'RECUPERAR', color: 'bg-cyan-200' },
    { label: 'CONSULTAR', color: 'bg-cyan-200' },
    { label: 'DEVOLUCIÓN', color: 'bg-orange-300' },
    { label: 'CANJEAR', color: 'bg-orange-300' },
    { label: 'DESCUENTO', color: 'bg-pink-300' },
    { label: 'ESTADO CTA', color: 'bg-purple-300' },
    { label: 'HISTORIAL', color: 'bg-emerald-300' },
    { label: 'LISTA ESPERA', color: 'bg-emerald-300' },
    { label: 'REPORTE', color: 'bg-orange-300' },
    { label: 'DESC FACT', color: 'bg-orange-300' },
    { label: 'VISTA PREVIA', color: 'bg-pink-300' },
    { label: 'IMPUESTO', color: 'bg-purple-300' },
    { label: 'INTER-ESTADO', color: 'bg-lime-200' },
    { label: 'CRÉDITO', color: 'bg-lime-200' },
    { label: 'CLUB A VENTA', color: 'bg-amber-200' },
    { label: 'BORRAR FACT', color: 'bg-amber-200' },
    { label: 'SALIR', color: 'bg-pink-300' },
  ];

  return (
    <div className="flex flex-col gap-2 mt-2">
      {/* Input Row */}
      <div className="flex gap-2 items-center bg-white p-2 border border-gray-300 rounded shadow-sm">
        <div className="flex flex-col w-20">
          <label className="text-xs text-gray-500">Cant</label>
          <input type="number" defaultValue={1} className="border border-gray-300 px-1 py-1 w-full text-sm outline-none focus:border-blue-500" />
        </div>

        <div className="flex flex-col flex-1">
          <label className="text-xs text-gray-500">Código de Barras / Buscar Producto</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearch?.(e.target.value)}
              className="flex-1 border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500 shadow-inner"
              placeholder="Escanear código o escribir nombre..."
              autoFocus
            />
            <button className="bg-blue-800 text-white p-1 rounded hover:bg-blue-700 px-3">
              <ArrowLeft size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-col w-32">
          <label className="text-xs text-gray-500">Cód. Item</label>
          <input type="text" className="border border-gray-300 px-1 py-1 w-full text-sm outline-none bg-gray-50" disabled />
        </div>
        <div className="flex flex-col w-48">
          <label className="text-xs text-gray-500">Nombre Item</label>
          <input type="text" className="border border-gray-300 px-1 py-1 w-full text-sm outline-none bg-gray-50" disabled />
        </div>
      </div>

      {/* Function Grid */}
      <div className="grid grid-cols-6 gap-1.5 h-48">
        {keys.map((k, i) => (
          <button
            key={i}
            className={`${k.color} text-gray-800 text-[10px] sm:text-xs font-bold shadow-sm border border-black/5 hover:brightness-105 active:scale-95 transition-transform flex items-center justify-center p-1 text-center leading-tight`}
          >
            {k.label}
          </button>
        ))}
      </div>
    </div>
  );
};