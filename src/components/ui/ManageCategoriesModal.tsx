import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { X, Plus, Trash2 } from 'lucide-react';

interface ManageCategoriesModalProps {
  onClose: () => void;
}

export const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({ onClose }) => {
  const { data: { categories }, addCategory, updateCategory, deleteCategory } = useWorkspace();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');

  const handleAdd = () => {
    if (newName.trim()) {
      addCategory(newName.trim(), newColor);
      setNewName('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-[15px] font-semibold text-white">Manage Categories</h2>
          <button onClick={onClose} className="text-apple-gray hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <input 
                  type="color" 
                  value={cat.color}
                  onChange={(e) => updateCategory(cat.id, cat.name, e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                <input 
                  type="text"
                  value={cat.name}
                  onChange={(e) => updateCategory(cat.id, e.target.value, cat.color)}
                  className="flex-1 bg-transparent border-none text-[13px] text-white focus:outline-none focus:ring-0"
                />
                <button 
                  onClick={() => deleteCategory(cat.id)}
                  className="p-1.5 text-apple-gray hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10">
            <h3 className="text-[12px] font-medium text-apple-secondary mb-3">Add New Category</h3>
            <div className="flex items-center gap-3">
              <input 
                type="color" 
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent shrink-0"
              />
              <input 
                type="text"
                placeholder="Category name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-[13px] text-white focus:outline-none focus:border-white/20"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <button 
                onClick={handleAdd}
                disabled={!newName.trim()}
                className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/15 disabled:opacity-50 transition-colors shrink-0"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
