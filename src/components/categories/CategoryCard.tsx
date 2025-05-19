import React from 'react';
import { Edit, Trash } from 'lucide-react';
import { Category } from '../../types';

interface CategoryCardProps {
  category: Category;
  taskCount: number;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  taskCount,
  onEdit,
  onDelete,
}) => {
  return (
    <div 
      className="flex items-center justify-between p-4 rounded-xl shadow-sm border border-gray-200 bg-white hover:shadow-md transition-all"
    >
      <div className="flex items-center">
        <div 
          className="h-5 w-5 rounded-lg mr-3" 
          style={{ backgroundColor: category.color }}
        ></div>
        <span className="font-medium text-gray-900">{category.name}</span>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {taskCount} task{taskCount !== 1 ? 's' : ''}
        </span>
        
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(category)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(category.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryCard;