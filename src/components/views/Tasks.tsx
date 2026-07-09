import React, { useState, useMemo } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { 
  Circle, 
  CheckCircle2, 
  CircleDashed, 
  XCircle, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  CircleDot
} from 'lucide-react';
import type { TaskItem, TaskStatus } from '../../data/initialState';
import { Avatar } from '../ui/Avatar';

const STATUS_GROUPS: TaskStatus[] = ['Backlog', 'Todo', 'In Progress', 'Done', 'Canceled'];

const StatusIcon = ({ status, className = '' }: { status: TaskStatus, className?: string }) => {
  const size = 15;
  switch (status) {
    case 'Backlog': return <CircleDashed size={size} className={`text-apple-tertiary ${className}`} />;
    case 'Todo': return <Circle size={size} className={`text-apple-secondary ${className}`} />;
    case 'In Progress': return <CircleDot size={size} className={`text-amber-400 ${className}`} />;
    case 'Done': return <CheckCircle2 size={size} className={`text-emerald-500 ${className}`} />;
    case 'Canceled': return <XCircle size={size} className={`text-red-500 ${className}`} />;
    default: return <Circle size={size} className={className} />;
  }
};



export const Tasks: React.FC = () => {
  const { data, updateTask } = useWorkspace();
  const { tasks } = data;
  
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (status: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, TaskItem[]> = {};
    STATUS_GROUPS.forEach(s => { grouped[s] = []; });
    tasks.forEach(t => {
      if (grouped[t.status]) {
        grouped[t.status].push(t);
      } else {
        // Fallback
        grouped['Todo'].push(t);
      }
    });
    return grouped;
  }, [tasks]);

  return (
    <div className="fade-in max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-white flex items-center gap-2">
            Issues
          </h1>
        </div>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-apple-base rounded-md text-[12px] font-medium hover:bg-white/90 transition-colors">
          <Plus size={14} />
          <span>New Issue</span>
        </button>
      </div>

      <div className="space-y-6">
        {STATUS_GROUPS.map(status => {
          const groupTasks = tasksByStatus[status];
          if (groupTasks.length === 0 && status !== 'Todo' && status !== 'In Progress') return null;
          
          const isCollapsed = collapsedGroups[status];

          return (
            <div key={status} className="flex flex-col">
              {/* Group Header */}
              <div 
                className="flex items-center gap-2 py-2 px-1 cursor-pointer group hover:bg-white/[0.02] rounded-md transition-colors w-max pr-4"
                onClick={() => toggleGroup(status)}
              >
                {isCollapsed ? <ChevronRight size={14} className="text-apple-tertiary" /> : <ChevronDown size={14} className="text-apple-tertiary" />}
                <StatusIcon status={status} />
                <span className="text-[13px] font-semibold text-white/90">{status}</span>
                <span className="text-[11.5px] text-apple-tertiary font-mono ml-1">{groupTasks.length}</span>
              </div>

              {/* Group List */}
              {!isCollapsed && (
                <div className="mt-1 flex flex-col border border-white/[0.04] rounded-xl overflow-hidden bg-white/[0.01]">
                  {groupTasks.length === 0 ? (
                    <div className="py-6 flex justify-center text-[12.5px] text-apple-tertiary">
                      No issues
                    </div>
                  ) : (
                    groupTasks.map((task, index) => (
                      <div 
                        key={task.id} 
                        className={`group flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors cursor-default ${index !== groupTasks.length - 1 ? 'border-b border-white/[0.03]' : ''}`}
                      >
                        <div className="flex-shrink-0 w-16 text-[11.5px] font-mono text-apple-tertiary group-hover:text-apple-secondary transition-colors">
                          {task.identifier}
                        </div>
                        
                        <div className="relative group/status flex-shrink-0 cursor-pointer">
                          <StatusIcon status={task.status} />
                          {/* Quick status change dropdown could go here on hover */}
                          <select
                            value={task.status}
                            onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
                            className="absolute inset-0 opacity-0 cursor-pointer text-[12px]"
                            title="Change status"
                          >
                            {STATUS_GROUPS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <span className={`text-[13px] font-medium truncate ${task.status === 'Done' || task.status === 'Canceled' ? 'text-apple-tertiary line-through decoration-white/20' : 'text-white/90'}`}>
                            {task.title}
                          </span>
                        </div>
                        
                        <div className="flex-shrink-0 flex items-center gap-2">
                          {task.labels && task.labels.map(label => (
                            <span 
                              key={label}
                              className="px-1.5 py-0.5 rounded-[4px] border border-white/[0.08] text-[10px] text-apple-secondary bg-white/[0.03]"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                        
                        {task.date && (
                          <div className="flex-shrink-0 w-16 text-right text-[11px] text-apple-tertiary whitespace-nowrap">
                            {new Date(task.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </div>
                        )}
                        
                        <div className="flex-shrink-0 ml-2" title={task.assignee}>
                          <Avatar name={task.assignee} size="xs" />
                        </div>
                      </div>
                    ))
                  )}
                  {/* Inline quick add could go here */}
                  <div className="flex items-center gap-3 px-4 py-2 border-t border-transparent hover:bg-white/[0.02] transition-colors cursor-pointer group">
                    <div className="flex-shrink-0 w-16" />
                    <Plus size={14} className="text-apple-tertiary group-hover:text-white/80 transition-colors" />
                    <span className="text-[12.5px] text-apple-tertiary group-hover:text-white/80 transition-colors">New issue</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
