import React from 'react';
import { RefreshCw, Ban, LogOut, Printer, Save, CreditCard, Banknote, Smartphone } from 'lucide-react';

interface RightPanelProps {
  subtotal?: number;
  discount?: number;
  total: number;
  onCheckout?: () => void;
  onPaymentSelect?: () => void;
  onClear?: () => void;
  onSave?: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  subtotal = 0,
  discount = 0,
  total,
  onCheckout,
  onPaymentSelect,
  onClear,
  onSave
}) => {
  const formatTotal = (num: number) => {
    return num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const Btn = ({ label, icon: Icon, color, onClick }: any) => (
    <button
      onClick={onClick}
      className={`${color} flex flex-col items-center justify-center p-2 rounded shadow-sm border border-gray-300 hover:brightness-110 active:scale-95 transition-all`}
    >
      {Icon && <Icon size={20} className="mb-1" />}
      <span className="text-xs font-bold uppercase">{label}</span>
    </button>
  );

  return (
    <div className="w-[320px] bg-gray-100 border-l border-gray-300 flex flex-col p-2 gap-2">
      {/* Total Display */}
      <div className="bg-blue-500 text-white p-4 rounded shadow mb-2">
        {subtotal > 0 && (
          <div className="text-xs opacity-80 mb-1 flex justify-between">
            <span>Subtotal:</span>
            <span>${formatTotal(subtotal)}</span>
          </div>
        )}
        {discount > 0 && (
          <div className="text-xs opacity-80 mb-1 flex justify-between">
            <span>Descuento:</span>
            <span>-${formatTotal(discount)}</span>
          </div>
        )}
        <div className="text-xs font-bold opacity-80 mb-1">TOTAL</div>
        <div className="text-4xl font-bold text-right tracking-tight">
          ${formatTotal(total)}
        </div>
      </div>

      {/* Top Controls */}
      <div className="grid grid-cols-3 gap-2 h-24">
        <Btn label="Recargar" color="bg-gray-200 text-gray-700" icon={RefreshCw} onClick={() => window.location.reload()} />
        <Btn label="Limpiar" color="bg-gray-200 text-gray-700" icon={Ban} onClick={onClear} />
        <Btn label="Salir" color="bg-gray-200 text-gray-700" icon={LogOut} onClick={() => { }} />
      </div>

      {/* Payment Methods */}
      <div className="grid grid-cols-2 gap-2 h-32">
        <Btn label="Efectivo" color="bg-green-500 text-white hover:bg-green-600" icon={Banknote} onClick={onCheckout || onPaymentSelect} />
        <Btn label="Tarjeta" color="bg-blue-500 text-white hover:bg-blue-600" icon={CreditCard} onClick={onCheckout || onPaymentSelect} />
        <Btn label="Transferencia" color="bg-purple-500 text-white hover:bg-purple-600" icon={Smartphone} onClick={onCheckout || onPaymentSelect} />
        <Btn label="Otro" color="bg-gray-400 text-white hover:bg-gray-500" onClick={onCheckout || onPaymentSelect} />
      </div>

      {/* Print/Save */}
      <div className="grid grid-cols-2 gap-2 h-16">
        <Btn label="Imprimir" color="bg-gray-300 text-gray-800" icon={Printer} />
        <Btn label="Guardar" color="bg-gray-300 text-gray-800" icon={Save} onClick={onSave} />
      </div>

      {/* Numpad */}
      <div className="flex-1 bg-white border border-gray-300 rounded p-1 grid grid-cols-3 gap-1 shadow-inner">
        {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(num => (
          <button key={num} className="bg-gray-200 text-xl font-bold text-gray-700 rounded hover:bg-gray-300">
            {num}
          </button>
        ))}
        <button className="bg-gray-200 text-xs font-bold text-gray-700 rounded hover:bg-gray-300">LIMPIAR</button>
        <button className="bg-gray-200 text-xl font-bold text-gray-700 rounded hover:bg-gray-300">0</button>
        <button className="bg-gray-200 text-xl font-bold text-gray-700 rounded hover:bg-gray-300">.</button>
        <button className="col-span-3 bg-gray-200 text-sm font-bold text-gray-700 rounded hover:bg-gray-300">BORRAR</button>
        <button className="col-span-3 bg-gray-300 text-lg font-bold text-gray-800 rounded hover:bg-blue-100 border border-gray-400">ENTRAR</button>
      </div>
    </div>
  );
};