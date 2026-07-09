import React, { useState } from 'react';
import type { KeyboardEvent } from 'react';
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

interface TaskGroupProps {
  status: TaskStatus;
  tasks: TaskItem[];
  assignee: 'Miral' | 'Shalini';
  isCollapsed: boolean;
  onToggle: () => void;
  onAddTask: (title: string, status: TaskStatus, assignee: 'Miral' | 'Shalini') => void;
}

const TaskGroup: React.FC<TaskGroupProps> = ({ status, tasks, assignee, isCollapsed, onToggle, onAddTask }) => {
  const { updateTask } = useWorkspace();
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (newTaskTitle.trim()) {
        onAddTask(newTaskTitle.trim(), status, assignee);
        setNewTaskTitle('');
        setIsAdding(false);
      }
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTaskTitle('');
    }
  };

  if (tasks.length === 0 && status !== 'Todo' && status !== 'In Progress') return null;

  return (
    <div className="flex flex-col">
      {/* Group Header */}
      <div 
        className="flex items-center gap-2 py-2 px-1 cursor-pointer group hover:bg-white/[0.02] rounded-md transition-colors w-max pr-4"
        onClick={onToggle}
      >
        {isCollapsed ? <ChevronRight size={14} className="text-apple-tertiary" /> : <ChevronDown size={14} className="text-apple-tertiary" />}
        <StatusIcon status={status} />
        <span className="text-[13px] font-semibold text-white/90">{status}</span>
        <span className="text-[11.5px] text-apple-tertiary font-mono ml-1">{tasks.length}</span>
      </div>

      {/* Group List */}
      {!isCollapsed && (
        <div className="mt-1 flex flex-col border border-white/[0.04] rounded-xl overflow-hidden bg-white/[0.01]">
          {tasks.length === 0 && !isAdding ? (
            <div className="py-6 flex justify-center text-[12.5px] text-apple-tertiary">
              No tasks
            </div>
          ) : (
            tasks.map((task, index) => (
              <div 
                key={task.id} 
                className={`group flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors cursor-default ${index !== tasks.length - 1 || isAdding ? 'border-b border-white/[0.03]' : ''}`}
              >
                <div className="flex-shrink-0 w-16 text-[11.5px] font-mono text-apple-tertiary group-hover:text-apple-secondary transition-colors">
                  {task.identifier}
                </div>
                
                <div className="relative group/status flex-shrink-0 cursor-pointer">
                  <StatusIcon status={task.status} />
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
          
          {/* Inline quick add */}
          {isAdding ? (
            <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.02]">
              <div className="flex-shrink-0 w-16" />
              <StatusIcon status={status} className="opacity-50" />
              <input
                autoFocus
                type="text"
                placeholder="Task title... (Press Enter to save, Esc to cancel)"
                className="flex-1 bg-transparent border-none outline-none text-[13px] text-white placeholder:text-apple-tertiary"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (!newTaskTitle.trim()) {
                    setIsAdding(false);
                  }
                }}
              />
            </div>
          ) : (
            <div 
              className="flex items-center gap-3 px-4 py-2 border-t border-transparent hover:bg-white/[0.02] transition-colors cursor-pointer group"
              onClick={() => setIsAdding(true)}
            >
              <div className="flex-shrink-0 w-16" />
              <Plus size={14} className="text-apple-tertiary group-hover:text-white/80 transition-colors" />
              <span className="text-[12.5px] text-apple-tertiary group-hover:text-white/80 transition-colors">New task</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const Tasks: React.FC = () => {
  const { data, role, addTask } = useWorkspace();
  const { tasks } = data;
  
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAddTask = (title: string, status: TaskStatus, assignee: 'Miral' | 'Shalini') => {
    addTask({
      title,
      status,
      priority: 'No priority',
      assignee,
      date: new Date().toISOString().split('T')[0],
      labels: []
    });
  };

  const isSupervisor = role === 'supervisor';
  const activePerson: 'Miral' | 'Shalini' = role === 'shalini' ? 'Shalini' : 'Miral';

  const shaliniTasks = tasks.filter(t => t.assignee === 'Shalini');
  const miralTasks = tasks.filter(t => t.assignee === 'Miral');

  const renderColumn = (assignee: 'Miral' | 'Shalini', columnTasks: TaskItem[]) => {
    const tasksByStatus: Record<string, TaskItem[]> = {};
    STATUS_GROUPS.forEach(s => { tasksByStatus[s] = []; });
    columnTasks.forEach(t => {
      if (tasksByStatus[t.status]) {
        tasksByStatus[t.status].push(t);
      } else {
        tasksByStatus['Todo'].push(t);
      }
    });

    return (
      <div className="space-y-6">
        {isSupervisor && (
          <div className="flex items-center gap-3 pb-2 border-b border-white/[0.06] mb-4">
            <Avatar name={assignee} size="sm" />
            <h2 className="text-[15px] font-semibold text-white tracking-tight">{assignee}'s Tasks</h2>
          </div>
        )}
        {STATUS_GROUPS.map(status => {
          const groupKey = `${assignee}-${status}`;
          return (
            <TaskGroup
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              assignee={assignee}
              isCollapsed={!!collapsedGroups[groupKey]}
              onToggle={() => toggleGroup(groupKey)}
              onAddTask={handleAddTask}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="fade-in max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-white flex items-center gap-2">
            Tasks
          </h1>
        </div>
      </div>

      {isSupervisor ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div>{renderColumn('Shalini', shaliniTasks)}</div>
          <div>{renderColumn('Miral', miralTasks)}</div>
        </div>
      ) : (
        <div className="max-w-4xl">
          {renderColumn(activePerson, role === 'shalini' ? shaliniTasks : miralTasks)}
        </div>
      )}
    </div>
  );
};
