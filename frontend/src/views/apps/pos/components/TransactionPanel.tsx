import React from 'react';
import { CartItem } from '../types';

interface TransactionTableProps {
  cart: CartItem[];
  selectedItemId: number | null;
  onQuantityChange?: (productId: number, quantity: number) => void;
  onDiscountChange?: (productId: number, discount: number) => void;
  onRemove?: (productId: number) => void;
  onSelectItem: (id: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  cart,
  selectedItemId,
  onSelectItem,
  onQuantityChange,
  onDiscountChange,
  onRemove
}) => {
  return (
    <div className="flex flex-col min-h-[300px] max-h-[40vh] bg-white border-b border-gray-200">
      {/* Table Header */}
      <div className="bg-blue-600 text-white grid grid-cols-12 gap-1 text-xs font-bold px-2 py-2 uppercase border-b border-blue-700 flex-shrink-0">
        <div className="col-span-1 truncate">Cód</div>
        <div className="col-span-5">Producto</div>
        <div className="col-span-1 text-center">Cant</div>
        <div className="col-span-2 text-right">Precio</div>
        <div className="col-span-1 text-right">Desc</div>
        <div className="col-span-2 text-right">Total</div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto min-h-[200px]">
        {cart.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400 p-6">
              <p className="text-lg">Carrito vacío</p>
              <p className="text-sm mt-2">Agrega productos haciendo clic en ellos</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {cart.map((item, index) => {
              const isSelected = item.id === selectedItemId;
              const price = item.salePrice || item.price;
              const itemTotal = (price * item.quantity) - item.discount;

              return (
                <div
                  key={`cart-item-${item.id}`}
                  onClick={() => onSelectItem(item.id)}
                  className={`
                    grid grid-cols-12 gap-1 px-2 py-2 text-sm cursor-pointer transition-colors
                    ${isSelected
                      ? 'bg-blue-100 text-blue-900 font-medium'
                      : index % 2 === 0
                        ? 'bg-gray-50 hover:bg-gray-100'
                        : 'bg-white hover:bg-gray-100'
                    }
                  `}
                >
                  <div className="col-span-1 font-mono text-xs truncate">{item.barcode || item.sku || '-'}</div>
                  <div className="col-span-5 truncate font-medium text-xs">{item.productName}</div>
                  <div className="col-span-1 text-center font-bold">{item.quantity}</div>
                  <div className="col-span-2 text-right text-xs">${price.toFixed(2)}</div>
                  <div className="col-span-1 text-right text-red-600 text-xs">${item.discount.toFixed(2)}</div>
                  <div className="col-span-2 text-right font-bold text-blue-700 text-xs">${itemTotal.toFixed(2)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Summary */}
      {cart.length > 0 && (
        <div className="border-t border-gray-300 bg-gray-50 px-2 py-2 flex-shrink-0">
          <div className="flex justify-between items-center text-xs font-medium">
            <span className="text-gray-600">Items en carrito:</span>
            <span className="text-gray-800">{cart.length} productos</span>
          </div>
        </div>
      )}
    </div>
  );
};