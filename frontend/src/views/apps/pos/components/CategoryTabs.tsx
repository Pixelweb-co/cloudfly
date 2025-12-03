import React from 'react';
import { Category } from '../../../../types/apps/Types';

interface CategoryTabsProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelectCategory(cat.id)}
          className={`
            whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200
            ${selectedCategory === cat.id
              ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }
          `}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
};