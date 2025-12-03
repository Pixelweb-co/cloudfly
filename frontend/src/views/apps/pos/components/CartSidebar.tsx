import React from 'react';
import { CartItem } from '../../../../types/apps/Types';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';

interface CartSidebarProps {
  cart: CartItem[];
  onUpdateQuantity: (id: number, delta: number) => void;
  onRemove: (id: number) => void;
  onClear: () => void;
  onCheckout: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  cart,
  onUpdateQuantity,
  onRemove,
  onClear,
  onCheckout
}) => {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.10; // 10% tax
  const total = subtotal + tax;

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 shadow-xl w-full md:w-[400px]">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
            <ShoppingCart size={20} />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Current Order</h2>
        </div>
        <button 
          onClick={onClear}
          disabled={cart.length === 0}
          className="text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear All
        </button>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-gray-50/50">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
            <ShoppingCart size={48} className="opacity-20" />
            <p className="text-center font-medium">Cart is empty</p>
            <p className="text-sm text-center max-w-[200px]">Select items from the menu to build an order.</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
              <img src={item.image} alt={item.productName} className="h-16 w-16 rounded-lg object-cover bg-gray-100" />
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800 truncate">{item.productName}</h4>
                <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                  <button 
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    className="p-1 hover:bg-white hover:shadow rounded-md text-gray-600 transition-all"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-semibold text-sm w-4 text-center">{item.quantity}</span>
                  <button 
                    onClick={() => onUpdateQuantity(item.id, 1)}
                    className="p-1 hover:bg-white hover:shadow rounded-md text-gray-600 transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button 
                  onClick={() => onRemove(item.id)}
                  className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
                >
                   Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer / Calculation */}
      <div className="p-6 bg-white border-t border-gray-200 space-y-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax (10%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-dashed border-gray-200">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={onCheckout}
          disabled={cart.length === 0}
          className="w-full py-4 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary-500/30 transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Checkout Now
        </button>
      </div>
    </div>
  );
};