import React, { useState, useMemo } from 'react';
import type { KeyboardEvent } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { 
  Circle, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  CircleDot,
  Trash2,
  X,
  ChevronLeft
} from 'lucide-react';
import type { TaskItem, TaskStatus, TaskPriority } from '../../data/initialState';
import { Avatar } from '../ui/Avatar';

const STATUS_GROUPS: TaskStatus[] = ['Todo', 'In Progress', 'Done', 'Canceled'];
const PRIORITIES: TaskPriority[] = ['Urgent', 'High', 'Medium', 'Low', 'No priority'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const StatusIcon = ({ status, className = '' }: { status: TaskStatus, className?: string }) => {
  const size = 15;
  switch (status) {
    case 'Todo': return <Circle size={size} className={`text-apple-secondary ${className}`} />;
    case 'In Progress': return <CircleDot size={size} className={`text-amber-400 ${className}`} />;
    case 'Done': return <CheckCircle2 size={size} className={`text-emerald-500 ${className}`} />;
    case 'Canceled': return <XCircle size={size} className={`text-red-500 ${className}`} />;
    default: return <Circle size={size} className={className} />;
  }
};

const PriorityBadge = ({ priority }: { priority: TaskPriority }) => {
  let colors = 'text-apple-secondary bg-white/[0.02] border-white/10';
  switch (priority) {
    case 'Urgent':
      colors = 'text-red-400 bg-red-500/10 border-red-500/25';
      break;
    case 'High':
      colors = 'text-orange-400 bg-orange-500/10 border-orange-500/25';
      break;
    case 'Medium':
      colors = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25';
      break;
    case 'Low':
      colors = 'text-blue-400 bg-blue-500/10 border-blue-500/25';
      break;
  }

  return (
    <span className={`px-1.5 py-0.5 rounded-[4px] border text-[10px] font-medium tracking-wide uppercase ${colors}`}>
      {priority}
    </span>
  );
};

interface MiniCalendarProps {
  tasks: TaskItem[];
  onDateClick: (dateStr: string) => void;
  selectedDate: string | null;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ tasks, onDateClick, selectedDate }) => {
  const [cursor, setCursor] = useState(() => new Date());

  const first = startOfMonth(cursor);
  const last = endOfMonth(cursor);
  const startWeekday = (first.getDay() + 6) % 7; // Mon is 0
  const daysInMonth = last.getDate();

  const cells = useMemo(() => {
    const arr: { date: Date | null; key: string }[] = [];
    for (let i = 0; i < startWeekday; i++) {
      arr.push({ date: null, key: `pad-start-${i}` });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(cursor.getFullYear(), cursor.getMonth(), d);
      arr.push({ date: dt, key: fmt(dt) });
    }
    while (arr.length % 7 !== 0) {
      arr.push({ date: null, key: `pad-end-${arr.length}` });
    }
    return arr;
  }, [cursor, startWeekday, daysInMonth]);

  const taskDates = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => {
      if (t.date) {
        counts[t.date] = (counts[t.date] || 0) + 1;
      }
    });
    return counts;
  }, [tasks]);

  const monthLabel = `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`;
  const todayStrVal = fmt(new Date());

  const goPrev = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  const goNext = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));

  return (
    <div className="flex flex-col bg-white/[0.02] border border-white/[0.04] p-4 rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] font-semibold text-white/95">{monthLabel}</span>
        <div className="flex items-center gap-1">
          <button 
            type="button"
            onClick={goPrev} 
            className="p-1 hover:bg-white/[0.06] text-apple-gray hover:text-white rounded-md transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <button 
            type="button"
            onClick={goNext} 
            className="p-1 hover:bg-white/[0.06] text-apple-gray hover:text-white rounded-md transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-apple-secondary font-semibold mb-1">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
          <div key={idx} className="h-5 flex items-center justify-center">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map(cell => {
          if (!cell.date) {
            return <div key={cell.key} className="h-6" />;
          }

          const dateStr = cell.key;
          const hasTasks = !!taskDates[dateStr];
          const isToday = dateStr === todayStrVal;
          const isSelected = dateStr === selectedDate;

          let btnClass = 'text-[11px] text-white/80 hover:bg-white/[0.06] rounded-md transition-all';
          if (isSelected) {
            btnClass = 'text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-md';
          } else if (isToday) {
            btnClass = 'text-[11px] font-semibold bg-white/10 text-white border border-white/20 rounded-md';
          }

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => onDateClick(dateStr)}
              className={`h-6 flex flex-col items-center justify-center relative ${btnClass}`}
              title={hasTasks ? `${taskDates[dateStr]} task(s) due` : undefined}
            >
              <span>{cell.date.getDate()}</span>
              {hasTasks && !isSelected && (
                <span className="absolute bottom-[2px] w-1 h-1 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface TaskModalProps {
  task?: TaskItem;
  defaultAssignee: 'Miral' | 'Shalini';
  onClose: () => void;
  onSave: (taskData: Omit<TaskItem, 'id' | 'identifier'> & { id?: string }) => void;
  onDelete?: (id: string) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, defaultAssignee, onClose, onSave, onDelete }) => {
  const { data: { categories }, role } = useWorkspace();
  const [title, setTitle] = useState(task?.title || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'Todo');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'No priority');
  const [assignee, setAssignee] = useState<'Miral' | 'Shalini'>(task?.assignee || defaultAssignee);
  const [category, setCategory] = useState(task?.category || '');
  const [date, setDate] = useState(task?.date || '');
  const [labelsStr, setLabelsStr] = useState(task?.labels.join(', ') || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const labels = labelsStr.split(',').map(l => l.trim()).filter(Boolean);
    onSave({
      id: task?.id,
      title: title.trim(),
      status,
      priority,
      assignee,
      category: category || undefined,
      date,
      labels
    });
  };

  const isSupervisor = role === 'supervisor';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <form 
        onSubmit={handleSubmit}
        className="bg-[#1c1c1e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden fade-in"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-[15px] font-semibold text-white">
            {task ? `Edit Task ${task.identifier}` : 'Create New Task'}
          </h2>
          <button type="button" onClick={onClose} className="text-apple-gray hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold tracking-wider text-apple-secondary uppercase">
              Title
            </label>
            <input 
              type="text" 
              placeholder="Task summary or title..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-white/20"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-semibold tracking-wider text-apple-secondary uppercase">
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-white/20 cursor-pointer"
              >
                {STATUS_GROUPS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-semibold tracking-wider text-apple-secondary uppercase">
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-white/20 cursor-pointer"
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-semibold tracking-wider text-apple-secondary uppercase">
                Assignee
              </label>
              {isSupervisor ? (
                <select
                  value={assignee}
                  onChange={e => setAssignee(e.target.value as 'Miral' | 'Shalini')}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-white/20 cursor-pointer"
                >
                  <option value="Miral">Miral</option>
                  <option value="Shalini">Shalini</option>
                </select>
              ) : (
                <div className="w-full bg-white/[0.02] border border-white/10 rounded-lg px-3 py-2 text-[13px] text-apple-gray flex items-center gap-2">
                  <Avatar name={assignee} size="xs" />
                  <span>{assignee} (Current Profile)</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-semibold tracking-wider text-apple-secondary uppercase">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-white/20 cursor-pointer"
              >
                <option value="">None</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-semibold tracking-wider text-apple-secondary uppercase">
                Due Date
              </label>
              <input 
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-white/20"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-semibold tracking-wider text-apple-secondary uppercase">
                Labels (comma-separated)
              </label>
              <input 
                type="text"
                placeholder="e.g. Design, Research"
                value={labelsStr}
                onChange={e => setLabelsStr(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-white/20"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <div>
            {task && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Delete Task</span>
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-[12px] text-apple-secondary hover:text-white/85 rounded-md hover:bg-white/[0.04] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-white/[0.08] text-white/95 border border-white/[0.08] hover:bg-white/[0.12] hover:border-white/[0.14] rounded-lg text-[12px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-colors"
            >
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

interface TaskGroupProps {
  status: TaskStatus;
  tasks: TaskItem[];
  assignee: 'Miral' | 'Shalini';
  isCollapsed: boolean;
  onToggle: () => void;
  onAddTaskInline: (title: string, status: TaskStatus, assignee: 'Miral' | 'Shalini') => void;
  onTaskClick: (task: TaskItem) => void;
  onDeleteTask: (id: string) => void;
  highlightedDate: string | null;
}

const TaskGroup: React.FC<TaskGroupProps> = ({ 
  status, 
  tasks, 
  assignee, 
  isCollapsed, 
  onToggle, 
  onAddTaskInline, 
  onTaskClick,
  onDeleteTask,
  highlightedDate
}) => {
  const { data: { categories }, updateTask } = useWorkspace();
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (newTaskTitle.trim()) {
        onAddTaskInline(newTaskTitle.trim(), status, assignee);
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
    <div className="flex flex-col w-full">
      <div 
        className="flex items-center gap-2 py-2 px-1 cursor-pointer group hover:bg-white/[0.02] rounded-md transition-colors w-max pr-4"
        onClick={onToggle}
      >
        {isCollapsed ? <ChevronRight size={14} className="text-apple-tertiary" /> : <ChevronDown size={14} className="text-apple-tertiary" />}
        <StatusIcon status={status} />
        <span className="text-[13px] font-semibold text-white/90">{status}</span>
        <span className="text-[11.5px] text-apple-tertiary font-mono ml-1">{tasks.length}</span>
      </div>

      {!isCollapsed && (
        <div className="mt-1 flex flex-col w-full border border-white/[0.04] rounded-xl overflow-hidden bg-white/[0.01]">
          {tasks.length === 0 && !isAdding ? (
            <div className="py-6 flex justify-center text-[12.5px] text-apple-tertiary">
              No tasks
            </div>
          ) : (
            tasks.map((task, index) => {
              const catObj = categories.find(c => c.name === task.category);
              const isHighlighted = highlightedDate === task.date;
              return (
                <div 
                  id={`task-row-${task.id}`}
                  key={task.id} 
                  className={`group flex flex-col gap-2 px-4 py-3 hover:bg-white/[0.03] transition-all cursor-pointer w-full ${
                    isHighlighted 
                      ? 'bg-emerald-500/10 border border-emerald-500/30 rounded-xl shadow-[0_0_12px_rgba(16,185,129,0.15)] my-1' 
                      : index !== tasks.length - 1 || isAdding ? 'border-b border-white/[0.03]' : ''
                  }`}
                  onClick={() => onTaskClick(task)}
                >
                  {/* Top Line: ID, Status, Title, Delete Button */}
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0 w-16 text-[11.5px] font-mono text-apple-tertiary group-hover:text-apple-secondary transition-colors pt-[2px]">
                      {task.identifier}
                    </div>
                    
                    <div 
                      className="relative group/status flex-shrink-0 cursor-pointer pt-[2px]"
                      onClick={e => e.stopPropagation()}
                    >
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
                    
                    <div className="flex-1 min-w-0">
                      <span className={`text-[13px] font-medium leading-relaxed block whitespace-normal break-words ${task.status === 'Done' || task.status === 'Canceled' ? 'text-apple-tertiary line-through decoration-white/20' : 'text-white/90'}`}>
                        {task.title}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTask(task.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-apple-secondary hover:text-red-400 hover:bg-red-400/10 rounded transition-all shrink-0 mt-[2px]"
                      title="Delete task"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Bottom Line: Metadata */}
                  <div className="flex items-center gap-2.5 ml-[92px] flex-wrap text-apple-tertiary w-full pr-[92px]">
                    {task.priority && task.priority !== 'No priority' && (
                      <PriorityBadge priority={task.priority} />
                    )}

                    {task.category && catObj && (
                      <span 
                        className="px-1.5 py-0.5 rounded-[4px] border text-[9.5px] uppercase font-bold tracking-wider"
                        style={{ 
                          color: catObj.color,
                          borderColor: catObj.color + '33',
                          backgroundColor: catObj.color + '15'
                        }}
                      >
                        {task.category}
                      </span>
                    )}

                    {task.labels && task.labels.map(label => (
                      <span 
                        key={label}
                        className="px-1.5 py-0.5 rounded-[4px] border border-white/[0.08] text-[10px] text-apple-secondary bg-white/[0.03]"
                      >
                        {label}
                      </span>
                    ))}
                    
                    {task.date && (
                      <span className="text-[11px] text-apple-tertiary whitespace-nowrap pl-1">
                        {new Date(task.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}

                    <div className="flex-1" />
                    
                    <div className="flex-shrink-0 mr-1" title={task.assignee}>
                      <Avatar name={task.assignee} size="xs" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
          
          {isAdding ? (
            <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.02] w-full">
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
              className="flex items-center gap-3 px-4 py-2 border-t border-transparent hover:bg-white/[0.02] transition-colors cursor-pointer group w-full"
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
  const { data, role, addTask, updateTask, deleteTask } = useWorkspace();
  const { tasks } = data;
  
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | undefined>(undefined);
  const [highlightedDate, setHighlightedDate] = useState<string | null>(null);
  const [highlightTimeout, setHighlightTimeout] = useState<any>(null);

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleOpenNewTask = () => {
    setSelectedTask(undefined);
    setModalOpen(true);
  };

  const handleTaskClick = (task: TaskItem) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  const handleSaveTask = (taskData: Omit<TaskItem, 'id' | 'identifier'> & { id?: string }) => {
    if (taskData.id) {
      updateTask(taskData.id, taskData);
    } else {
      addTask(taskData);
    }
    setModalOpen(false);
  };

  const handleDeleteTask = (id: string) => {
    deleteTask(id);
    setModalOpen(false);
  };

  const handleAddTaskInline = (title: string, status: TaskStatus, assignee: 'Miral' | 'Shalini') => {
    addTask({
      title,
      status,
      priority: 'No priority',
      assignee,
      date: new Date().toISOString().split('T')[0],
      labels: []
    });
  };

  const handleDateClick = (dateStr: string) => {
    setHighlightedDate(dateStr);
    
    // Find the first task matching the date
    const matchingTasks = tasks.filter(t => t.date === dateStr);
    
    const currentVisibleTasks = matchingTasks.filter(t => {
      if (role === 'supervisor') return true;
      const activePerson = role === 'shalini' ? 'Shalini' : 'Miral';
      return t.assignee === activePerson;
    });

    if (currentVisibleTasks.length > 0) {
      const firstTask = currentVisibleTasks[0];
      // Expand group if collapsed
      const groupKey = `${firstTask.assignee}-${firstTask.status}`;
      if (collapsedGroups[groupKey]) {
        setCollapsedGroups(prev => ({ ...prev, [groupKey]: false }));
      }
      
      setTimeout(() => {
        const element = document.getElementById(`task-row-${firstTask.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 80);
    }

    if (highlightTimeout) {
      clearTimeout(highlightTimeout);
    }

    const timeout = setTimeout(() => {
      setHighlightedDate(null);
    }, 2800);
    setHighlightTimeout(timeout);
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
      <div className="space-y-6 w-full">
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
              onAddTaskInline={handleAddTaskInline}
              onTaskClick={handleTaskClick}
              onDeleteTask={handleDeleteTask}
              highlightedDate={highlightedDate}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="fade-in max-w-7xl mx-auto pb-20">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Main Columns Container */}
        <div className="flex-1 w-full min-w-0">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-[20px] font-semibold tracking-tight text-white flex items-center gap-2">
                Tasks
              </h1>
            </div>
            <button 
              onClick={handleOpenNewTask}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.08] text-white/95 border border-white/[0.08] hover:bg-white/[0.12] hover:border-white/[0.14] rounded-lg text-[12px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-colors"
            >
              <Plus size={14} />
              <span>New Task</span>
            </button>
          </div>

          {isSupervisor ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 w-full">
              <div className="w-full">{renderColumn('Shalini', shaliniTasks)}</div>
              <div className="w-full">{renderColumn('Miral', miralTasks)}</div>
            </div>
          ) : (
            <div className="max-w-4xl w-full">
              {renderColumn(activePerson, role === 'shalini' ? shaliniTasks : miralTasks)}
            </div>
          )}
        </div>

        {/* Sidebar Mini Calendar */}
        <div className="w-full lg:w-72 lg:sticky lg:top-8 shrink-0 flex flex-col gap-4">
          <div className="text-[11px] font-semibold tracking-wider text-apple-secondary uppercase pl-1">
            Task Calendar
          </div>
          <MiniCalendar 
            tasks={role === 'supervisor' ? tasks : (role === 'shalini' ? shaliniTasks : miralTasks)} 
            onDateClick={handleDateClick} 
            selectedDate={highlightedDate} 
          />
        </div>
      </div>

      {modalOpen && (
        <TaskModal
          task={selectedTask}
          defaultAssignee={activePerson}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
};
