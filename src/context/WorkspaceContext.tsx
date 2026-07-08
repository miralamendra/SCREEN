import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialWorkspaceData } from '../data/initialState';
import type { WorkspaceData, DailyLogEntry, WeeklyReflection, DeliverableItem, MeetingEvent, Role, CustomCategory } from '../data/initialState';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface WorkspaceContextType {
  role: Role | null;
  setRole: (role: Role | null) => void;
  data: WorkspaceData;
  syncMode: 'synced' | 'local';
  addCategory: (name: string, color: string) => void;
  updateCategory: (id: string, name: string, color: string) => void;
  deleteCategory: (id: string) => void;
  addDailyLog: (log: Omit<DailyLogEntry, 'id'>) => void;
  deleteDailyLog: (id: string) => void;
  updateDailyLog: (id: string, log: Partial<Omit<DailyLogEntry, 'id'>>) => void;
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
    try {
      return (localStorage.getItem('hec_user_role') as Role) || null;
    } catch (e) {
      return null;
    }
  });

  const [syncMode, setSyncMode] = useState<'synced' | 'local'>('local');

  const [data, setData] = useState<WorkspaceData>(() => {
    const currentVersion = '8';
    try {
      const savedVersion = localStorage.getItem('hec_data_version');
      if (savedVersion !== currentVersion) {
        localStorage.clear();
        localStorage.setItem('hec_data_version', currentVersion);
        return initialWorkspaceData;
      }
      const saved = localStorage.getItem('hec_workspace_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.dailyLogs && parsed.deliverables && parsed.weeklyReflections && parsed.roadmaps && parsed.meetings) {
          if (!parsed.categories) {
            parsed.categories = initialWorkspaceData.categories;
          }
          return parsed;
        }
      }
    } catch (e) {
      // fallback
    }
    return initialWorkspaceData;
  });

  // Sync to local storage for offline fallback persistence
  useEffect(() => {
    try {
      localStorage.setItem('hec_workspace_data', JSON.stringify(data));
    } catch (e) {
      // ignore quota or security exceptions
    }
  }, [data]);

  // Load and sync live data from Supabase
  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) {
      setSyncMode('local');
      return;
    }

    const fetchAllData = async () => {
      try {
        const [catsRes, logsRes, refsRes, delsRes, meetsRes] = await Promise.all([
          client.from('categories').select('*'),
          client.from('daily_logs').select('*'),
          client.from('weekly_reflections').select('*'),
          client.from('deliverables').select('*'),
          client.from('meetings').select('*'),
        ]);

        if (catsRes.error) throw catsRes.error;
        if (logsRes.error) throw logsRes.error;
        if (refsRes.error) throw refsRes.error;
        if (delsRes.error) throw delsRes.error;
        if (meetsRes.error) throw meetsRes.error;

        console.log('Supabase Connected Successfully.');
        console.log('Fetched Deliverables count:', delsRes.data?.length, delsRes.data);
        console.log('Fetched Categories count:', catsRes.data?.length, catsRes.data);

        const weeklyReflections: WeeklyReflection[] = (refsRes.data || []).map(r => ({
          weekId: r.week_id,
          miralReflection: { done: r.miral_done || '', blockers: r.miral_blockers || '', next: r.miral_next || '' },
          shaliniReflection: { done: r.shalini_done || '', blockers: r.shalini_blockers || '', next: r.shalini_next || '' },
          supervisorComment: r.supervisor_comment || '',
          supervisorCommentMiral: r.supervisor_comment_miral || '',
          supervisorCommentShalini: r.supervisor_comment_shalini || '',
          isReviewed: r.is_reviewed || false
        }));

        const deliverables: DeliverableItem[] = (delsRes.data || []).map(d => ({
          id: d.id,
          name: d.name,
          dueDate: d.due_date,
          owner: d.owner,
          status: d.status as DeliverableItem['status'],
          quarter: d.quarter
        }));

        const meetings: MeetingEvent[] = (meetsRes.data || []).map(m => ({
          id: m.id,
          date: m.date,
          category: m.category,
          title: m.title,
          locationLink: m.location_link || '',
          attendees: m.attendees || [],
          outcome: m.outcome || ''
        }));

        setData({
          categories: catsRes.data || [],
          dailyLogs: logsRes.data || [],
          weeklyReflections,
          deliverables,
          roadmaps: initialWorkspaceData.roadmaps,
          meetings
        });
        setSyncMode('synced');
      } catch (err) {
        console.error('Error fetching data from Supabase:', err);
        setSyncMode('local');
      }
    };

    fetchAllData();

    // Subscribe to Postgres changes for live cross-device synchronizations
    const channel = client
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchAllData();
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  const setRole = (newRole: Role | null) => {
    setRoleState(newRole);
    try {
      if (newRole) {
        localStorage.setItem('hec_user_role', newRole);
      } else {
        localStorage.removeItem('hec_user_role');
      }
    } catch (e) {
      // ignore
    }
  };

  const addCategory = async (name: string, color: string) => {
    const newCategory: CustomCategory = {
      id: `cat-${Date.now()}`,
      name,
      color
    };
    setData(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }));
    if (syncMode === 'synced' && supabase) {
      await supabase.from('categories').insert([{ id: newCategory.id, name, color }]);
    }
  };

  const updateCategory = async (id: string, name: string, color: string) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.map(cat => 
        cat.id === id ? { ...cat, name, color } : cat
      ),
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

    if (syncMode === 'synced' && supabase) {
      await supabase.from('categories').update({ name, color }).eq('id', id);
    }
  };

  const deleteCategory = async (id: string) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat.id !== id)
    }));
    if (syncMode === 'synced' && supabase) {
      await supabase.from('categories').delete().eq('id', id);
    }
  };

  const addDailyLog = async (log: Omit<DailyLogEntry, 'id'>) => {
    const newEntry: DailyLogEntry = {
      ...log,
      id: `log-${Date.now()}`
    };
    setData(prev => ({
      ...prev,
      dailyLogs: [newEntry, ...prev.dailyLogs]
    }));
    if (syncMode === 'synced' && supabase) {
      await supabase.from('daily_logs').insert([{
        id: newEntry.id,
        date: log.date,
        person: log.person,
        category: log.category,
        description: log.description,
        link: log.link || null,
        takeaway: log.takeaway || null
      }]);
    }
  };

  const deleteDailyLog = async (id: string) => {
    setData(prev => ({
      ...prev,
      dailyLogs: prev.dailyLogs.filter(log => log.id !== id)
    }));
    if (syncMode === 'synced' && supabase) {
      await supabase.from('daily_logs').delete().eq('id', id);
    }
  };

  const updateDailyLog = async (id: string, log: Partial<Omit<DailyLogEntry, 'id'>>) => {
    setData(prev => ({
      ...prev,
      dailyLogs: prev.dailyLogs.map(entry =>
        entry.id === id ? { ...entry, ...log } : entry
      )
    }));
    if (syncMode === 'synced' && supabase) {
      const updateData: any = {};
      if (log.date !== undefined) updateData.date = log.date;
      if (log.person !== undefined) updateData.person = log.person;
      if (log.category !== undefined) updateData.category = log.category;
      if (log.description !== undefined) updateData.description = log.description;
      if (log.link !== undefined) updateData.link = log.link || null;
      if (log.takeaway !== undefined) updateData.takeaway = log.takeaway || null;
      await supabase.from('daily_logs').update(updateData).eq('id', id);
    }
  };

  const updateDeliverableStatus = async (id: string, status: DeliverableItem['status']) => {
    setData(prev => ({
      ...prev,
      deliverables: prev.deliverables.map(item => 
        item.id === id ? { ...item, status } : item
      )
    }));
    if (syncMode === 'synced' && supabase) {
      await supabase.from('deliverables').update({ status }).eq('id', id);
    }
  };

  const updateWeeklyReflection = async (
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

    if (syncMode === 'synced' && supabase) {
      const { data: existing } = await supabase.from('weekly_reflections').select('*').eq('week_id', weekId).maybeSingle();
      
      const updateData: any = {};
      if (person === 'Miral') {
        if (section === 'done') updateData.miral_done = val;
        else if (section === 'blockers') updateData.miral_blockers = val;
        else if (section === 'next') updateData.miral_next = val;
      } else {
        if (section === 'done') updateData.shalini_done = val;
        else if (section === 'blockers') updateData.shalini_blockers = val;
        else if (section === 'next') updateData.shalini_next = val;
      }
      updateData.is_reviewed = false;

      if (existing) {
        await supabase.from('weekly_reflections').update(updateData).eq('week_id', weekId);
      } else {
        await supabase.from('weekly_reflections').insert([{
          week_id: weekId,
          ...updateData
        }]);
      }
    }
  };

  const addSupervisorComment = async (weekId: string, comment: string, isReviewed: boolean) => {
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

    if (syncMode === 'synced' && supabase) {
      const { data: existing } = await supabase.from('weekly_reflections').select('*').eq('week_id', weekId).maybeSingle();
      if (existing) {
        await supabase.from('weekly_reflections').update({ supervisor_comment: comment, is_reviewed: isReviewed }).eq('week_id', weekId);
      } else {
        await supabase.from('weekly_reflections').insert([{
          week_id: weekId,
          supervisor_comment: comment,
          is_reviewed: isReviewed
        }]);
      }
    }
  };

  const addSupervisorCommentForPerson = async (weekId: string, person: 'Miral' | 'Shalini', comment: string, isReviewed: boolean) => {
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

    if (syncMode === 'synced' && supabase) {
      const { data: existing } = await supabase.from('weekly_reflections').select('*').eq('week_id', weekId).maybeSingle();
      const col = person === 'Miral' ? 'supervisor_comment_miral' : 'supervisor_comment_shalini';
      
      if (existing) {
        await supabase.from('weekly_reflections').update({ [col]: comment, is_reviewed: isReviewed }).eq('week_id', weekId);
      } else {
        await supabase.from('weekly_reflections').insert([{
          week_id: weekId,
          [col]: comment,
          is_reviewed: isReviewed
        }]);
      }
    }
  };

  const addMeeting = async (meeting: Omit<MeetingEvent, 'id'>) => {
    const newMeeting: MeetingEvent = {
      ...meeting,
      id: `meet-${Date.now()}`
    };
    setData(prev => ({
      ...prev,
      meetings: [newMeeting, ...prev.meetings]
    }));

    if (syncMode === 'synced' && supabase) {
      await supabase.from('meetings').insert([{
        id: newMeeting.id,
        date: meeting.date,
        category: meeting.category,
        title: meeting.title,
        location_link: meeting.locationLink || null,
        attendees: meeting.attendees,
        outcome: meeting.outcome || null
      }]);
    }
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
      syncMode,
      addCategory,
      updateCategory,
      deleteCategory,
      addDailyLog,
      deleteDailyLog,
      updateDailyLog,
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