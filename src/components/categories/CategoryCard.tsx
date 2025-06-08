import React from 'react';
import { Edit, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  
  const handleCategoryClick = () => {
    // Navigate to tasks page with category filter
    navigate(`/tasks?categoryId=${category.id}`);
  };
  return (
    <div 
      className="flex items-center justify-between p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer hover:scale-[1.02]"
      onClick={handleCategoryClick}
    >
      <div className="flex items-center">
        <div 
          className="h-5 w-5 rounded-lg mr-3" 
          style={{ backgroundColor: category.color }}
        ></div>
        <span className="font-medium text-gray-900 dark:text-gray-100">{category.name}</span>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {taskCount} task{taskCount !== 1 ? 's' : ''}
        </span>
        
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(category);
            }}
            className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all hover:scale-110"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(category.id);
            }}
            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all hover:scale-110"
          >
            <Trash size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryCard;