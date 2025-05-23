import React, { useState, useEffect } from 'react';
import { Project } from '../../types';
import { useAppContext } from '../../context/AppContext';
import Button from '../common/Button';

interface ProjectFormProps {
  project?: Project;
  onClose: () => void;
  isEdit?: boolean;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  onClose,
  isEdit = false,
}) => {
  const { addProject, updateProject } = useAppContext();
  
  const initialState: Partial<Project> = {
    name: '',
    description: '',
    color: '#3B82F6', // Default blue color
    ...project,
  };
  
  const [formData, setFormData] = useState<Partial<Project>>(initialState);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (project) {
      setFormData({ ...project });
    } else {
      setFormData(initialState);
    }
  }, [project]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (isEdit && project) {
      updateProject({ ...project, ...formData } as Project);
    } else {
      addProject(formData);
    }
    
    onClose();
  };

  // Predefined color palette
  const colorPalette = [
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#10B981', // Green
    '#06B6D4', // Cyan
    '#6366F1', // Indigo
    '#A855F7', // Violet
    '#F97316', // Orange
    '#FBBF24', // Light Amber
    '#34D399', // Light Green
    '#60A5FA', // Light Blue
    '#C084FC', // Light Purple
    '#F87171', // Light Red
    '#FCD34D', // Light Yellow
    '#6EE7B7', // Light Teal
    '#93C5FD', // Light Sky Blue
    '#A78BFA', // Light Indigo
    '#FCA5A5', // Light Rose
    '#FDE68A', // Light Gold
    '#A7F3D0', // Light Mint
    '#BFDBFE', // Light Cornflower Blue
    '#DDD6FE', // Light Lavender
    '#FECACA', // Light Salmon
    '#FEF3C7', // Light Peach
    '#D1FAE5', // Light Aqua
    '#DBEAFE', // Light Powder Blue
    '#E0E7FF', // Light Periwinkle
    '#FEE2E2', // Light Coral
    '#FEF9C3', // Light Cream
    '#DCFCE7', // Light Lime
    '#E0F2FE', // Light Azure
    '#EDE9FE', // Light Lilac
    '#FEE2E2', // Light Blush
    '#FEF3C7', // Light Apricot
    '#D1FAE5', // Light Seafoam
    '#DBEAFE', // Light Ice Blue
    '#E0E7FF', // Light Slate Blue
    '#FEE2E2', // Light Dusty Rose
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Project Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name || ''}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            errors.name ? 'border-red-500' : ''
          }`}
          placeholder="Enter project name"
          autoFocus
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={formData.description || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Add details about this project"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Color
        </label>
        <div className="grid grid-cols-5 gap-2">
          {colorPalette.map(color => (
            <div
              key={color}
              className={`h-8 w-full rounded-md cursor-pointer transition-all ${
                formData.color === color
                  ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setFormData(prev => ({ ...prev, color }))}
            ></div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
        >
          {isEdit ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
};

export default ProjectForm;