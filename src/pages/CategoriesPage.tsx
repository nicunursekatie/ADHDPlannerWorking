import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Category, Task } from '../types';
import CategoryCard from '../components/categories/CategoryCard';
import CategoryForm from '../components/categories/CategoryForm';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Empty from '../components/common/Empty';
import Card from '../components/common/Card';
import { 
  Plus, 
  Tag, 
  TrendingUp, 
  AlertTriangle, 
  Activity,
  Calendar,
  Target,
  Zap,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Grid3X3,
  List,
  BarChart3
} from 'lucide-react';
import { formatDistanceToNow, isThisWeek, isPast, startOfWeek, subWeeks } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface CategoryMetrics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  dueThisWeek: number;
  completionRate: number;
  lastActivity: Date | null;
  activityLevel: 'high' | 'medium' | 'low' | 'dormant';
  weeklyChange: number;
  needsAttention: boolean;
}

// Enhanced Category Card Component
interface EnhancedCategoryCardProps {
  category: Category;
  metrics: CategoryMetrics;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
  viewMode: 'grid' | 'list';
  animationDelay: number;
}

const EnhancedCategoryCard: React.FC<EnhancedCategoryCardProps> = ({
  category,
  metrics,
  onEdit,
  onDelete,
  viewMode,
  animationDelay
}) => {
  const navigate = useNavigate();
  
  const handleCategoryClick = () => {
    navigate(`/tasks?categoryId=${category.id}`);
  };

  const getActivityIcon = () => {
    switch (metrics.activityLevel) {
      case 'high': return '🔥';
      case 'medium': return '⚡';
      case 'low': return '📊';
      case 'dormant': return '💤';
    }
  };

  const getActivityColor = () => {
    switch (metrics.activityLevel) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-yellow-600 bg-yellow-100';
      case 'dormant': return 'text-gray-600 bg-gray-100';
    }
  };

  const progressRadius = 20;
  const progressCircumference = 2 * Math.PI * progressRadius;
  const progressOffset = progressCircumference - (metrics.completionRate / 100) * progressCircumference;

  if (viewMode === 'list') {
    return (
      <Card
        variant="glass"
        className={`transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-fadeInUp cursor-pointer border-l-4 ${
          metrics.needsAttention ? 'border-l-red-500 bg-red-50/30' : ''
        }`}
        style={{ 
          animationDelay: `${animationDelay}s`,
          borderLeftColor: !metrics.needsAttention ? category.color : undefined
        }}
        onClick={handleCategoryClick}
      >
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div 
                className="w-12 h-12 rounded-xl flex-shrink-0 shadow-lg"
                style={{ backgroundColor: category.color }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActivityColor()}`}>
                    {getActivityIcon()} {metrics.activityLevel}
                  </span>
                  {metrics.needsAttention && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      ⚠️ Needs attention
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <span>{metrics.totalTasks} tasks</span>
                  {metrics.overdueTasks > 0 && (
                    <span className="text-red-600 font-semibold">
                      {metrics.overdueTasks} overdue
                    </span>
                  )}
                  {metrics.dueThisWeek > 0 && (
                    <span className="text-orange-600">
                      {metrics.dueThisWeek} due this week
                    </span>
                  )}
                  {metrics.lastActivity && (
                    <span className="text-gray-500">
                      Last activity: {formatDistanceToNow(metrics.lastActivity)} ago
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Progress Ring */}
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 50 50">
                  <circle
                    cx="25"
                    cy="25"
                    r={progressRadius}
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="25"
                    cy="25"
                    r={progressRadius}
                    stroke={category.color}
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={progressCircumference}
                    strokeDashoffset={progressOffset}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-700">
                    {metrics.completionRate}%
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCategoryClick();
                  }}
                  className="text-xs"
                >
                  View Tasks
                </Button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(category);
                  }}
                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(category.id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Grid view
  return (
    <Card
      variant="glass"
      className={`transition-all duration-300 hover:shadow-xl hover:-translate-y-2 animate-fadeInUp cursor-pointer group ${
        metrics.needsAttention ? 'ring-2 ring-red-200 bg-red-50/30' : ''
      }`}
      style={{ 
        animationDelay: `${animationDelay}s`,
        background: `linear-gradient(135deg, ${category.color}10, white)`
      }}
      onClick={handleCategoryClick}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl shadow-lg group-hover:scale-110 transition-transform"
              style={{ backgroundColor: category.color }}
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700">
                {category.name}
              </h3>
              <div className="flex items-center gap-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActivityColor()}`}>
                  {getActivityIcon()}
                </span>
                {metrics.needsAttention && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    ⚠️
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(category);
              }}
              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
            >
              ✏️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(category.id);
              }}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Tasks</span>
            <span className="font-semibold text-gray-900">{metrics.totalTasks}</span>
          </div>
          
          {metrics.overdueTasks > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-600">Overdue</span>
              <span className="font-semibold text-red-600">{metrics.overdueTasks}</span>
            </div>
          )}
          
          {metrics.dueThisWeek > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-orange-600">Due this week</span>
              <span className="font-semibold text-orange-600">{metrics.dueThisWeek}</span>
            </div>
          )}
          
          {metrics.lastActivity && (
            <div className="text-xs text-gray-500">
              Last activity: {formatDistanceToNow(metrics.lastActivity)} ago
            </div>
          )}
        </div>

        {/* Progress Ring */}
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 50 50">
              <circle
                cx="25"
                cy="25"
                r={progressRadius}
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="25"
                cy="25"
                r={progressRadius}
                stroke={category.color}
                strokeWidth="3"
                fill="none"
                strokeDasharray={progressCircumference}
                strokeDashoffset={progressOffset}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-700">
                {metrics.completionRate}%
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Weekly Change</div>
            <div className={`text-sm font-semibold flex items-center gap-1 ${
              metrics.weeklyChange > 0 ? 'text-green-600' : 
              metrics.weeklyChange < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {metrics.weeklyChange > 0 ? '📈' : metrics.weeklyChange < 0 ? '📉' : '➖'}
              {Math.abs(metrics.weeklyChange)}%
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleCategoryClick();
            }}
            className="flex-1 text-xs"
            style={{ backgroundColor: category.color }}
          >
            View Tasks
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Add quick task creation
            }}
            className="text-xs"
          >
            + Task
          </Button>
        </div>
      </div>
    </Card>
  );
};

const CategoriesPage: React.FC = () => {
  const { categories, tasks, deleteCategory } = useAppContext();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'activity' | 'tasks' | 'overdue'>('activity');
  
  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
    } else {
      setEditingCategory(null);
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };
  
  const handleOpenDeleteConfirm = (categoryId: string) => {
    setConfirmDelete(categoryId);
  };
  
  const handleCloseDeleteConfirm = () => {
    setConfirmDelete(null);
  };
  
  const handleDeleteCategory = () => {
    if (confirmDelete) {
      deleteCategory(confirmDelete);
      setConfirmDelete(null);
    }
  };

  // Calculate comprehensive metrics for each category
  const getCategoryMetrics = (categoryId: string): CategoryMetrics => {
    const categoryTasks = tasks.filter(task => 
      task.categoryIds?.includes(categoryId) && !task.archived
    );
    
    const completedTasks = categoryTasks.filter(task => task.completed);
    const overdueTasks = categoryTasks.filter(task => 
      !task.completed && task.dueDate && isPast(new Date(task.dueDate))
    );
    const dueThisWeek = categoryTasks.filter(task => 
      !task.completed && task.dueDate && isThisWeek(new Date(task.dueDate))
    );

    const completionRate = categoryTasks.length > 0 
      ? Math.round((completedTasks.length / categoryTasks.length) * 100)
      : 0;

    // Find most recent activity
    const lastActivity = categoryTasks.reduce<Date | null>((latest, task) => {
      const taskDate = task.updatedAt ? new Date(task.updatedAt) : null;
      if (!taskDate) return latest;
      return !latest || taskDate > latest ? taskDate : latest;
    }, null);

    // Calculate activity level
    const daysSinceActivity = lastActivity 
      ? Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    let activityLevel: 'high' | 'medium' | 'low' | 'dormant';
    if (daysSinceActivity <= 1) activityLevel = 'high';
    else if (daysSinceActivity <= 7) activityLevel = 'medium';
    else if (daysSinceActivity <= 30) activityLevel = 'low';
    else activityLevel = 'dormant';

    // Calculate weekly change (mock calculation for now)
    const thisWeekStart = startOfWeek(new Date());
    const lastWeekStart = subWeeks(thisWeekStart, 1);
    
    const thisWeekTasks = categoryTasks.filter(task => {
      const taskDate = task.updatedAt ? new Date(task.updatedAt) : null;
      return taskDate && taskDate >= thisWeekStart;
    }).length;
    
    const lastWeekTasks = categoryTasks.filter(task => {
      const taskDate = task.updatedAt ? new Date(task.updatedAt) : null;
      return taskDate && taskDate >= lastWeekStart && taskDate < thisWeekStart;
    }).length;

    const weeklyChange = lastWeekTasks > 0 
      ? Math.round(((thisWeekTasks - lastWeekTasks) / lastWeekTasks) * 100)
      : thisWeekTasks > 0 ? 100 : 0;

    const needsAttention = overdueTasks.length > 0 || 
      (categoryTasks.length > 0 && activityLevel === 'dormant') ||
      (categoryTasks.length > 5 && completionRate < 30);

    return {
      totalTasks: categoryTasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      dueThisWeek: dueThisWeek.length,
      completionRate,
      lastActivity,
      activityLevel,
      weeklyChange,
      needsAttention
    };
  };

  // Calculate overall insights
  const categoryInsights = useMemo(() => {
    const metrics = categories.map(category => ({
      category,
      metrics: getCategoryMetrics(category.id)
    }));

    const needsAttention = metrics.filter(m => m.metrics.needsAttention);
    const totalOverdue = metrics.reduce((sum, m) => sum + m.metrics.overdueTasks, 0);
    const mostActive = metrics.reduce((best, current) => 
      current.metrics.activityLevel === 'high' && 
      current.metrics.totalTasks > (best?.metrics.totalTasks || 0) 
        ? current : best
    , null);
    const leastActive = metrics.filter(m => m.metrics.totalTasks > 0 && m.metrics.activityLevel === 'dormant');
    const smallCategories = metrics.filter(m => m.metrics.totalTasks > 0 && m.metrics.totalTasks < 3);

    return {
      needsAttention,
      totalOverdue,
      mostActive,
      leastActive,
      smallCategories,
      totalCategories: categories.length,
      activeCategories: metrics.filter(m => m.metrics.totalTasks > 0).length
    };
  }, [categories, tasks]);

  // Sort categories based on selected criteria
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const aMetrics = getCategoryMetrics(a.id);
      const bMetrics = getCategoryMetrics(b.id);

      switch (sortBy) {
        case 'activity':
          const activityOrder = { high: 4, medium: 3, low: 2, dormant: 1 };
          return activityOrder[bMetrics.activityLevel] - activityOrder[aMetrics.activityLevel];
        case 'tasks':
          return bMetrics.totalTasks - aMetrics.totalTasks;
        case 'overdue':
          return bMetrics.overdueTasks - aMetrics.overdueTasks;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [categories, tasks, sortBy]);
  
  return (
    <div className="min-h-screen space-y-6 animate-fadeIn">
      {/* Enhanced Header */}
      <Card 
        variant="glass-purple" 
        padding="md" 
        gradient
        className="border-0 shadow-purple-lg bg-gradient-to-r from-primary-500/90 via-primary-600/90 to-accent-500/90"
      >
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div className="text-white">
            <h1 className="text-3xl font-display font-bold tracking-tight mb-1 flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Tag className="w-6 h-6" />
              </div>
              Categories
            </h1>
            <p className="text-white/80 font-medium">
              {categoryInsights.activeCategories} of {categoryInsights.totalCategories} categories active
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-1 flex gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-white text-primary-600 shadow-md' 
                    : 'text-white hover:bg-white/20'
                }`}
                title="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list' 
                    ? 'bg-white text-primary-600 shadow-md' 
                    : 'text-white hover:bg-white/20'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl border-0 text-sm font-semibold"
            >
              <option value="activity">Sort by Activity</option>
              <option value="tasks">Sort by Task Count</option>
              <option value="overdue">Sort by Overdue</option>
              <option value="name">Sort by Name</option>
            </select>
            
            {/* New Category Button */}
            <Button
              variant="secondary"
              icon={<Plus size={18} />}
              onClick={() => handleOpenModal()}
              className="bg-white text-primary-600 hover:bg-white/90 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              New Category
            </Button>
          </div>
        </div>
      </Card>

      {/* Category Insights Summary */}
      {categoryInsights.needsAttention.length > 0 && (
        <Card variant="glass" className="border-amber-200 bg-amber-50/50">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-900 mb-2">Categories Need Attention</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryInsights.needsAttention.slice(0, 3).map(({ category, metrics }) => (
                    <div key={category.id} className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{category.name}</p>
                        <p className="text-sm text-amber-700">
                          {metrics.overdueTasks > 0 && `${metrics.overdueTasks} overdue`}
                          {metrics.overdueTasks > 0 && metrics.activityLevel === 'dormant' && ' • '}
                          {metrics.activityLevel === 'dormant' && 'No recent activity'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {categoryInsights.needsAttention.length > 3 && (
                  <p className="text-sm text-amber-700 mt-3">
                    ...and {categoryInsights.needsAttention.length - 3} more categories need attention
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="glass" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">
                {categories.reduce((sum, cat) => sum + getCategoryMetrics(cat.id).totalTasks, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="glass" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{categoryInsights.totalOverdue}</p>
            </div>
          </div>
        </Card>

        <Card variant="glass" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Categories</p>
              <p className="text-2xl font-bold text-green-600">{categoryInsights.activeCategories}</p>
            </div>
          </div>
        </Card>

        <Card variant="glass" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Most Active</p>
              <p className="text-lg font-bold text-purple-600 truncate">
                {categoryInsights.mostActive?.category.name || 'None'}
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Category Grid/List */}
      {categories.length > 0 ? (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          : "space-y-4"
        }>
          {sortedCategories.map((category, index) => {
            const metrics = getCategoryMetrics(category.id);
            
            return (
              <EnhancedCategoryCard
                key={category.id}
                category={category}
                metrics={metrics}
                onEdit={handleOpenModal}
                onDelete={handleOpenDeleteConfirm}
                viewMode={viewMode}
                animationDelay={index * 0.1}
              />
            );
          })}
        </div>
      ) : (
        <Empty
          title="No categories yet"
          description="Create your first category to organize your tasks"
          icon={<Tag className="mx-auto h-12 w-12 text-gray-400" />}
          action={
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => handleOpenModal()}
            >
              New Category
            </Button>
          }
        />
      )}
      
      {/* Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
      >
        <CategoryForm
          category={editingCategory || undefined}
          onClose={handleCloseModal}
          isEdit={!!editingCategory}
        />
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={handleCloseDeleteConfirm}
        title="Delete Category"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this category? Tasks associated with this category will remain, but will no longer have this category assigned.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={handleCloseDeleteConfirm}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteCategory}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CategoriesPage;