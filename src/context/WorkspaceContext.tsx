import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialWorkspaceData } from '../data/initialState';
import type { WorkspaceData, DailyLogEntry, WeeklyReflection, DeliverableItem, MeetingEvent, Role, CustomCategory } from '../data/initialState';

interface WorkspaceContextType {
  role: Role | null;
  setRole: (role: Role | null) => void;
  data: WorkspaceData;
  addCategory: (name: string, color: string) => void;
  updateCategory: (id: string, name: string, color: string) => void;
  deleteCategory: (id: string) => void;
  addDailyLog: (log: Omit<DailyLogEntry, 'id'>) => void;
  deleteDailyLog: (id: string) => void;
  updateDeliverableStatus: (id: string, status: DeliverableItem['status']) => void;
  updateWeeklyReflection: (weekId: string, person: 'Miral' | 'Shalini', section: 'done' | 'blockers' | 'next', val: string) => void;
  addSupervisorComment: (weekId: string, comment: string, isReviewed: boolean) => void;
  addSupervisorCommentForPerson: (weekId: string, person: 'Miral' | 'Shalini', comment: string, isReviewed: boolean) => void;
  addMeeting: (meeting: Omit<MeetingEvent, 'id'>) => void;
  exportToCSV: (section: 'logs' | 'deliverables' | 'roadmap' | 'meetings') => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<Role | null>(() => {
    return (localStorage.getItem('hec_user_role') as Role) || null;
  });

  const [data, setData] = useState<WorkspaceData>(() => {
    const currentVersion = '7';
    const savedVersion = localStorage.getItem('hec_data_version');
    if (savedVersion !== currentVersion) {
      localStorage.clear();
      localStorage.setItem('hec_data_version', currentVersion);
      return initialWorkspaceData;
    }
    const saved = localStorage.getItem('hec_workspace_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.dailyLogs && parsed.deliverables && parsed.weeklyReflections && parsed.roadmaps && parsed.meetings) {
          // Migration for categories
          if (!parsed.categories) {
            parsed.categories = initialWorkspaceData.categories;
          }
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return initialWorkspaceData;
  });

  useEffect(() => {
    localStorage.setItem('hec_workspace_data', JSON.stringify(data));
  }, [data]);

  const setRole = (newRole: Role | null) => {
    setRoleState(newRole);
    if (newRole) {
      localStorage.setItem('hec_user_role', newRole);
    } else {
      localStorage.removeItem('hec_user_role');
    }
  };

  const addCategory = (name: string, color: string) => {
    const newCategory: CustomCategory = {
      id: `cat-${Date.now()}`,
      name,
      color
    };
    setData(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }));
  };

  const updateCategory = (id: string, name: string, color: string) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.map(cat => 
        cat.id === id ? { ...cat, name, color } : cat
      ),
      // Update logs/meetings that might have used the old name if we want, but currently categories use `name` instead of `id` in logs
      // Wait, since we store the name in logs, if they change the name, we should update the logs/meetings!
      dailyLogs: prev.dailyLogs.map(log => {
        const oldCat = prev.categories.find(c => c.id === id);
        if (oldCat && log.category === oldCat.name) {
          return { ...log, category: name };
        }
        return log;
      }),
      meetings: prev.meetings.map(meet => {
        const oldCat = prev.categories.find(c => c.id === id);
        if (oldCat && meet.category === oldCat.name) {
          return { ...meet, category: name };
        }
        return meet;
      })
    }));
  };

  const deleteCategory = (id: string) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat.id !== id)
    }));
  };

  const addDailyLog = (log: Omit<DailyLogEntry, 'id'>) => {
    const newEntry: DailyLogEntry = {
      ...log,
      id: `log-${Date.now()}`
    };
    setData(prev => ({
      ...prev,
      dailyLogs: [newEntry, ...prev.dailyLogs]
    }));
  };

  const deleteDailyLog = (id: string) => {
    setData(prev => ({
      ...prev,
      dailyLogs: prev.dailyLogs.filter(log => log.id !== id)
    }));
  };

  const updateDeliverableStatus = (id: string, status: DeliverableItem['status']) => {
    setData(prev => ({
      ...prev,
      deliverables: prev.deliverables.map(item => 
        item.id === id ? { ...item, status } : item
      )
    }));
  };

  const updateWeeklyReflection = (
    weekId: string, 
    person: 'Miral' | 'Shalini', 
    section: 'done' | 'blockers' | 'next', 
    val: string
  ) => {
    setData(prev => {
      const existingIndex = prev.weeklyReflections.findIndex(r => r.weekId === weekId);
      let updatedReflections = [...prev.weeklyReflections];

      const defaultReflection: WeeklyReflection = {
        weekId,
        miralReflection: { done: '', blockers: '', next: '' },
        shaliniReflection: { done: '', blockers: '', next: '' },
        isReviewed: false
      };

      if (existingIndex > -1) {
        const existing = { ...updatedReflections[existingIndex] };
        if (person === 'Miral') {
          existing.miralReflection = { ...existing.miralReflection, [section]: val };
        } else {
          existing.shaliniReflection = { ...existing.shaliniReflection, [section]: val };
        }
        existing.isReviewed = false;
        updatedReflections[existingIndex] = existing;
      } else {
        const newRef = { ...defaultReflection };
        if (person === 'Miral') {
          newRef.miralReflection = { ...newRef.miralReflection, [section]: val };
        } else {
          newRef.shaliniReflection = { ...newRef.shaliniReflection, [section]: val };
        }
        updatedReflections.push(newRef);
      }

      return {
        ...prev,
        weeklyReflections: updatedReflections
      };
    });
  };

  const addSupervisorComment = (weekId: string, comment: string, isReviewed: boolean) => {
    setData(prev => {
      const existingIndex = prev.weeklyReflections.findIndex(r => r.weekId === weekId);
      let updatedReflections = [...prev.weeklyReflections];

      if (existingIndex > -1) {
        const existing = { ...updatedReflections[existingIndex] };
        existing.supervisorComment = comment;
        existing.isReviewed = isReviewed;
        updatedReflections[existingIndex] = existing;
      } else {
        updatedReflections.push({
          weekId,
          miralReflection: { done: '', blockers: '', next: '' },
          shaliniReflection: { done: '', blockers: '', next: '' },
          supervisorComment: comment,
          isReviewed
        });
      }

      return {
        ...prev,
        weeklyReflections: updatedReflections
      };
    });
  };

  const addSupervisorCommentForPerson = (weekId: string, person: 'Miral' | 'Shalini', comment: string, isReviewed: boolean) => {
    setData(prev => {
      const existingIndex = prev.weeklyReflections.findIndex(r => r.weekId === weekId);
      let updatedReflections = [...prev.weeklyReflections];

      const field = person === 'Miral' ? 'supervisorCommentMiral' : 'supervisorCommentShalini';

      if (existingIndex > -1) {
        const existing = { ...updatedReflections[existingIndex] };
        existing[field] = comment;
        existing.isReviewed = isReviewed;
        updatedReflections[existingIndex] = existing;
      } else {
        const newReflection: any = {
          weekId,
          miralReflection: { done: '', blockers: '', next: '' },
          shaliniReflection: { done: '', blockers: '', next: '' },
          isReviewed
        };
        newReflection[field] = comment;
        updatedReflections.push(newReflection);
      }

      return {
        ...prev,
        weeklyReflections: updatedReflections
      };
    });
  };

  const addMeeting = (meeting: Omit<MeetingEvent, 'id'>) => {
    const newMeeting: MeetingEvent = {
      ...meeting,
      id: `meet-${Date.now()}`
    };
    setData(prev => ({
      ...prev,
      meetings: [newMeeting, ...prev.meetings]
    }));
  };

  const exportToCSV = (section: 'logs' | 'deliverables' | 'roadmap' | 'meetings') => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `${section}_export.csv`;

    if (section === 'logs') {
      headers = ['Date', 'Person', 'Category', 'Description', 'Link', 'Takeaway'];
      rows = data.dailyLogs.map(l => [
        l.date,
        l.person,
        l.category,
        l.description,
        l.link || '',
        l.takeaway || ''
      ]);
    } else if (section === 'deliverables') {
      headers = ['Name', 'Due Date', 'Owner', 'Status', 'Quarter'];
      rows = data.deliverables.map(d => [
        d.name,
        d.dueDate,
        d.owner,
        d.status,
        d.quarter
      ]);
    } else if (section === 'roadmap') {
      headers = ['Quarter', 'Theme', 'Owner', 'Planned Activities'];
      rows = data.roadmaps.map(r => [
        r.quarter,
        r.theme,
        r.owner,
        r.activities.join('; ')
      ]);
    } else if (section === 'meetings') {
      headers = ['Date', 'Category', 'Title', 'Location/Link', 'Attendees', 'Outcome'];
      rows = data.meetings.map(m => [
        m.date,
        m.category,
        m.title,
        m.locationLink,
        m.attendees.join(', '),
        m.outcome
      ]);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <WorkspaceContext.Provider value={{
      role,
      setRole,
      data,
      addCategory,
      updateCategory,
      deleteCategory,
      addDailyLog,
      deleteDailyLog,
      updateDeliverableStatus,
      updateWeeklyReflection,
      addSupervisorComment,
      addSupervisorCommentForPerson,
      addMeeting,
      exportToCSV
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
};
