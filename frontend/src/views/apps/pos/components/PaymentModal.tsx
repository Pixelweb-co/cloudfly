import React, { useState, useEffect } from 'react';
import { PaymentMethod } from '../types';
import { X, CreditCard, Banknote, QrCode, Loader2, CheckCircle } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  total: number;
  onClose: () => void;
  onConfirm: (method: PaymentMethod) => Promise<void>;
  isProcessing?: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  total,
  onClose,
  onConfirm,
  isProcessing: externalProcessing
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CASH');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setIsProcessing(false);
      setReceivedAmount('');
      setSelectedMethod('CASH');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      await onConfirm(selectedMethod);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const change = Math.max(0, parseFloat(receivedAmount || '0') - total);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">Completar Pago</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={isProcessing}>
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                <CheckCircle size={32} />
              </div>
              <h4 className="text-2xl font-bold text-gray-800">¡Pago Exitoso!</h4>
              <p className="text-gray-500">Imprimiendo recibo...</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <span className="text-sm text-gray-500 uppercase trackingwide">Monto Total</span>
                <div className="text-4xl font-extrabold text-gray-900 mt-1">
                  ${total.toFixed(2)}
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <label className="text-sm font-medium text-gray-700 block mb-2">Método de Pago</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'CASH' as PaymentMethod, icon: Banknote, label: 'Efectivo' },
                    { id: 'CREDIT_CARD' as PaymentMethod, icon: CreditCard, label: 'Crédito' },
                    { id: 'DEBIT_CARD' as PaymentMethod, icon: CreditCard, label: 'Débito' },
                    { id: 'TRANSFER' as PaymentMethod, icon: QrCode, label: 'Transferencia' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`
                        flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all
                        ${selectedMethod === method.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <method.icon size={24} className="mb-2" />
                      <span className="text-xs font-semibold">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedMethod === 'CASH' && (
                <div className="mb-6 bg-gray-50 p-4 rounded-xl space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Efectivo Recibido</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        value={receivedAmount}
                        onChange={(e) => setReceivedAmount(e.target.value)}
                        className="w-full pl-7 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-700">Cambio</span>
                    <span className="font-bold text-lg text-blue-600">${change.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={isProcessing || (selectedMethod === 'CASH' && parseFloat(receivedAmount || '0') < total)}
                className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-lg shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing && <Loader2 size={20} className="animate-spin" />}
                {isProcessing ? 'Procesando...' : 'Confirmar Pago'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};