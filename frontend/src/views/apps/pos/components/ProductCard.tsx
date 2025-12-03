import React from 'react';
import { ProductType } from '../../../../types/apps/productType';
import { Plus } from 'lucide-react';

interface ProductCardProps {
  product: ProductType;
  onAdd: (product: ProductType) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd }) => {
  return (
    <div 
      onClick={() => onAdd(product)}
      className="group relative flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative h-40 w-full overflow-hidden">
        <img 
          src={product.image} 
          alt={product.productName} 
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-800 text-lg leading-tight mb-1">{product.productName}</h3>
        <p className="text-sm text-gray-500 mb-4">{product.categoryIds.length ? product.categoryIds[0] : ''}</p>
        
        <div className="mt-auto flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
            <Plus size={18} />
          </div>
        </div>
      </div>
    </div>
  );
};