import React from 'react';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';

interface PosHeaderProps {
  invoiceNo: number | string;
  lineCount: number;
  totalQty: number;
  customerName?: string;
  onCustomerClick?: () => void;
}

export const PosHeader: React.FC<PosHeaderProps> = ({
  invoiceNo,
  lineCount,
  totalQty,
  customerName = 'Mostrador',
  onCustomerClick
}) => {
  const dateStr = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white border-b border-gray-300 shadow-sm text-sm">
      {/* Top Row: Invoice Info */}
      <div className="flex items-center gap-4 p-2 px-4">
        <div className="flex flex-col">
          <label className="font-bold text-gray-600 text-xs uppercase">Nº Factura</label>
          <div className="bg-white border border-gray-300 px-2 py-1 w-24 font-bold text-gray-800 text-center shadow-inner text-xs truncate">
            {invoiceNo}
          </div>
        </div>

        <div className="flex flex-col">
          <label className="font-bold text-gray-600 text-xs uppercase">Fecha</label>
          <div className="font-bold text-gray-800">{dateStr}</div>
        </div>

        <div className="flex flex-col items-center px-4">
          <label className="font-bold text-gray-600 text-xs uppercase">Líneas</label>
          <div className="font-bold text-gray-800 text-lg">{lineCount}</div>
        </div>

        <div className="flex flex-col items-center px-4">
          <label className="font-bold text-gray-600 text-xs uppercase">Cantidad</label>
          <div className="font-bold text-gray-800 text-lg">{totalQty.toFixed(2)}</div>
        </div>

        <div className="flex flex-col items-center px-4">
          <label className="font-bold text-gray-600 text-xs uppercase">Tipo Venta</label>
          <div className="font-bold text-gray-800">Retail</div>
        </div>

        <div className="flex flex-col items-center px-4">
          <label className="font-bold text-gray-600 text-xs uppercase">Pago</label>
          <div className="font-bold text-gray-800">Efectivo</div>
        </div>
      </div>

      {/* Second Row: Customer Info */}
      <div className="flex items-center gap-2 p-2 px-4 bg-gray-50 border-t border-gray-200">
        <label className="text-gray-600 font-semibold w-20">Cliente</label>
        <div
          className="border border-gray-300 px-2 py-1 w-40 text-sm bg-white cursor-pointer hover:bg-blue-50 flex items-center gap-2 truncate"
          onClick={onCustomerClick}
        >
          <User size={14} className="text-blue-600" />
          <span className="font-medium text-gray-800 truncate">{customerName}</span>
        </div>

        <label className="text-gray-600 font-semibold ml-4">Teléfono</label>
        <input className="border border-gray-300 px-2 py-1 w-32 text-sm focus:border-blue-500 outline-none" disabled />

        <label className="text-gray-600 font-semibold ml-4">Tarjeta Puntos</label>
        <input className="border border-gray-300 px-2 py-1 w-32 text-sm focus:border-blue-500 outline-none" disabled />

        <div className="flex-1"></div>

        {/* Navigation Buttons */}
        <div className="flex gap-1">
          <button className="bg-blue-900 text-white p-1 rounded-full hover:bg-blue-800">
            <ChevronLeft size={20} />
          </button>
          <button className="bg-blue-900 text-white p-1 rounded-full hover:bg-blue-800">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white flex justify-between px-4 py-1 text-xs font-bold text-gray-500 border-t border-gray-200 uppercase">
        <span>Descuento: 0.00</span>
        <span>Devolución: 0.00</span>
        <span>Pagado: 0.00</span>
        <span className="text-gray-800">Balance: 0.00</span>
      </div>
    </div>
  );
};