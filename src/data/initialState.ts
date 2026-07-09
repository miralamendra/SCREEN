export type Role = 'miral' | 'shalini' | 'supervisor';

export interface CustomCategory {
  id: string;
  name: string;
  color: string;
}

export interface DailyLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  person: 'Miral' | 'Shalini';
  category: string;
  description: string;
  link?: string;
  takeaway?: string; // One-line takeaway for Literature Review
}

export interface WeeklyReflection {
  weekId: string; // e.g., "2026-W28"
  miralReflection: { done: string; blockers: string; next: string };
  shaliniReflection: { done: string; blockers: string; next: string };
  supervisorComment?: string;
  supervisorCommentMiral?: string;
  supervisorCommentShalini?: string;
  isReviewed: boolean;
}

export interface DeliverableItem {
  id: string;
  name: string;
  dueDate: string; // YYYY-MM-DD
  owner: 'Miral' | 'Shalini';
  status: 'Not started' | 'In progress' | 'Done' | 'Late';
  quarter: string;
}

export interface QuarterRoadmap {
  id: string;
  quarter: string;
  theme: string;
  owner: 'Miral' | 'Shalini';
  activities: string[];
}

export interface MeetingEvent {
  id: string;
  date: string; // YYYY-MM-DD
  category: string;
  title: string;
  locationLink: string;
  attendees: ('Miral' | 'Shalini' | 'Dr. Chathura')[];
  outcome: string;
}

export type TaskStatus = 'Backlog' | 'Todo' | 'In Progress' | 'Done' | 'Canceled';
export type TaskPriority = 'No priority' | 'Urgent' | 'High' | 'Medium' | 'Low';

export interface TaskItem {
  id: string;
  identifier: string; // e.g. TSK-123
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: 'Miral' | 'Shalini';
  date: string; // YYYY-MM-DD, optional
  labels: string[];
}

export interface WorkspaceData {
  categories: CustomCategory[];
  dailyLogs: DailyLogEntry[];
  weeklyReflections: WeeklyReflection[];
  deliverables: DeliverableItem[];
  roadmaps: QuarterRoadmap[];
  meetings: MeetingEvent[];
  tasks: TaskItem[];
}

// Generate dates relative to current date for pre-seeding
const getRelativeDateStr = (daysOffset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

const generateRecurringMeetings = (): MeetingEvent[] => {
  const today = new Date();
  const day = today.getDay();
  // Find Monday of the current week
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today);
  monday.setDate(diff);

  const getFormattedDate = (baseDate: Date, offsetDays: number): string => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  return [
    {
      id: 'meet-rec-mon',
      date: getFormattedDate(monday, 0),
      category: 'Supervisor Meeting',
      title: 'SCREEN- Dilmah research project (Monday)',
      locationLink: 'https://meet.google.com/vmf-znku-wdt',
      attendees: ['Miral', 'Shalini', 'Dr. Chathura'],
      outcome: 'Weekly project coordination and milestone planning.'
    },
    {
      id: 'meet-rec-wed',
      date: getFormattedDate(monday, 2),
      category: 'Supervisor Meeting',
      title: 'SCREEN- Dilmah research project (Wednesday)',
      locationLink: 'https://meet.google.com/ita-pspp-pge',
      attendees: ['Miral', 'Shalini', 'Dr. Chathura'],
      outcome: 'Mid-week sprint check-in and task progress updates.'
    },
    {
      id: 'meet-rec-fri',
      date: getFormattedDate(monday, 4),
      category: 'Supervisor Meeting',
      title: 'SCREEN- Dilmah research project (Friday)',
      locationLink: 'https://meet.google.com/cqa-razj-gpv',
      attendees: ['Miral', 'Shalini', 'Dr. Chathura'],
      outcome: 'Weekly review of researcher updates and supervisor feedback.'
    }
  ];
};

export const initialWorkspaceData: WorkspaceData = {
  categories: [
    { id: 'cat-1', name: 'Literature Review', color: '#10b981' }, // emerald-500
    { id: 'cat-2', name: 'Prototype & Model Development', color: '#8b5cf6' }, // violet-500
    { id: 'cat-3', name: 'Writing & Documentation', color: '#3b82f6' }, // blue-500
    { id: 'cat-4', name: 'Meetings & Presentations', color: '#f59e0b' }, // amber-500
    { id: 'cat-5', name: 'Supervisor Meeting', color: '#ec4899' }, // pink-500
    { id: 'cat-6', name: 'Research Conference', color: '#06b6d4' }, // cyan-500
    { id: 'cat-7', name: 'Lecture or Seminar', color: '#f97316' }, // orange-500
    { id: 'cat-8', name: 'Field Visit', color: '#84cc16' }, // lime-500
    { id: 'cat-9', name: 'Workshop', color: '#6366f1' }, // indigo-500
    { id: 'cat-10', name: 'Other Work', color: '#6b7280' }, // gray-500
  ],
  dailyLogs: [
    // Preseed past logs to match "Miral 4 days, Shalini 3 days" logged this week
    // We assume current day is Wednesday or Thursday. Let's seed logs for Mon, Tue, Wed...
    {
      id: 'log-1',
      date: getRelativeDateStr(-3),
      person: 'Miral',
      category: 'Literature Review',
      description: 'Reviewed 3 serious games focusing on wildlife conservation and analyzed player incentive frameworks.',
      takeaway: 'Serious games must reward coexistence behaviors directly to build long-term empathy in child players.',
      link: 'https://doi.org/10.1016/j.cosrev.2026.101'
    },
    {
      id: 'log-2',
      date: getRelativeDateStr(-2),
      person: 'Miral',
      category: 'Prototype & Model Development',
      description: 'Built basic movement mechanics for elephant entities in the Unity serious game mock project.',
      link: 'https://github.com/miral-amendra/hec-serious-game'
    },
    {
      id: 'log-3',
      date: getRelativeDateStr(-1),
      person: 'Miral',
      category: 'Writing & Documentation',
      description: 'Drafted introduction section for progress report 01 outlining human-elephant conflict metrics.',
    },
    {
      id: 'log-4',
      date: getRelativeDateStr(0),
      person: 'Miral',
      category: 'Meetings & Presentations',
      description: 'Presented initial wireframe designs to local community representatives for feedback on HEC representations.',
    },
    {
      id: 'log-5',
      date: getRelativeDateStr(-3),
      person: 'Shalini',
      category: 'Literature Review',
      description: 'Analyzed publications on Generative AI models applied to agricultural coexistence narratives.',
      takeaway: 'Local wisdom structures must be converted to prompt system instructions for contextual reasoning.',
      link: 'https://arxiv.org/abs/2603.04561'
    },
    {
      id: 'log-6',
      date: getRelativeDateStr(-2),
      person: 'Shalini',
      category: 'Writing & Documentation',
      description: 'Reviewed ethical compliance standards for deploying generative AI text tools in rural areas.',
    },
    {
      id: 'log-7',
      date: getRelativeDateStr(-1),
      person: 'Shalini',
      category: 'Prototype & Model Development',
      description: 'Tested initial API wrapper for LLM responses mapped against local wisdom database.',
      link: 'https://github.com/shalini-somarathna/hec-genai-wisdom'
    }
  ],
  weeklyReflections: [
    {
      weekId: '2026-W28',
      miralReflection: {
        done: 'Implemented core elephant behaviors and basic serious game wireframe flow.',
        blockers: 'Slight delay in obtaining updated HEC maps from the regional forestry department.',
        next: 'Complete game UI draft mockups and integrate feedback from child psychology literature.'
      },
      shaliniReflection: {
        done: 'Completed system architecture diagram and verified API integrations for generative assistant.',
        blockers: 'None.',
        next: 'Begin ethical clearance approval documentation and submit draft to institutional board.'
      },
      supervisorComment: 'testing commetn 1',
      isReviewed: true
    }
  ],
  deliverables: [
    // Miral — Study 2: Gamification
    { id: 'del-m-1', name: 'Demo serious game prototype', dueDate: '2026-08-31', owner: 'Miral', status: 'In progress', quarter: 'Q1 2026' },
    { id: 'del-m-2', name: 'Progress Report 01', dueDate: '2026-11-30', owner: 'Miral', status: 'Not started', quarter: 'Q2 2026' },
    { id: 'del-m-3', name: 'Academic Publication 01', dueDate: '2026-11-30', owner: 'Miral', status: 'Not started', quarter: 'Q2 2026' },
    { id: 'del-m-4', name: 'Beta serious game (validation build)', dueDate: '2027-02-28', owner: 'Miral', status: 'Not started', quarter: 'Q3 2026' },
    { id: 'del-m-5', name: 'Progress Report 02', dueDate: '2027-02-28', owner: 'Miral', status: 'Not started', quarter: 'Q3 2026' },
    { id: 'del-m-6', name: 'Final refined serious game product', dueDate: '2027-05-31', owner: 'Miral', status: 'Not started', quarter: 'Q4 2026/2027' },
    { id: 'del-m-7', name: 'Final project report', dueDate: '2027-05-31', owner: 'Miral', status: 'Not started', quarter: 'Q4 2026/2027' },
    { id: 'del-m-8', name: 'User manual & guide', dueDate: '2027-05-31', owner: 'Miral', status: 'Not started', quarter: 'Q4 2026/2027' },
    { id: 'del-m-9', name: 'Academic Publication 02', dueDate: '2027-05-31', owner: 'Miral', status: 'Not started', quarter: 'Q4 2026/2027' },

    // Shalini — Study 1: GenAI Application
    { id: 'del-s-1', name: 'Demo generative web application', dueDate: '2026-08-31', owner: 'Shalini', status: 'In progress', quarter: 'Q1 2026' },
    { id: 'del-s-2', name: 'Progress Report 01', dueDate: '2026-11-30', owner: 'Shalini', status: 'Not started', quarter: 'Q2 2026' },
    { id: 'del-s-3', name: 'Academic Publication 01', dueDate: '2026-11-30', owner: 'Shalini', status: 'Not started', quarter: 'Q2 2026' },
    { id: 'del-s-4', name: 'Functional web prototype (pilot)', dueDate: '2027-02-26', owner: 'Shalini', status: 'Not started', quarter: 'Q3 2026' },
    { id: 'del-s-5', name: 'Progress Report 02', dueDate: '2027-02-26', owner: 'Shalini', status: 'Not started', quarter: 'Q3 2026' },
    { id: 'del-s-6', name: 'UAT report', dueDate: '2027-05-31', owner: 'Shalini', status: 'Not started', quarter: 'Q4 2026/2027' },
    { id: 'del-s-7', name: 'Progress Report 03', dueDate: '2027-05-31', owner: 'Shalini', status: 'Not started', quarter: 'Q4 2026/2027' },
    { id: 'del-s-8', name: 'Final web prototype', dueDate: '2027-08-30', owner: 'Shalini', status: 'Not started', quarter: 'Q1 2027' },
    { id: 'del-s-9', name: 'Final project report', dueDate: '2027-08-30', owner: 'Shalini', status: 'Not started', quarter: 'Q1 2027' },
    { id: 'del-s-10', name: 'Academic Publication 02', dueDate: '2027-08-30', owner: 'Shalini', status: 'Not started', quarter: 'Q1 2027' }
  ],
  roadmaps: [
    // Miral's roadmap
    { id: 'rm-m-1', quarter: 'Q1 2026', theme: 'Research Foundation, Game Concept and Demo Development', owner: 'Miral', activities: ['Literature review on HEC, gamification, serious games, and child psychology', 'Review of conflict data and elephant behavioral statistics', 'Target group profiling', 'Game narrative and logic development', 'Paper prototype and UI/UX wireframes'] },
    { id: 'rm-m-2', quarter: 'Q2 2026', theme: 'Game Development and Asset Refinement', owner: 'Miral', activities: ['Game building inside Unity Engine', 'Asset illustration (Photoshop/Illustrator)', 'Consequence-based game mechanics implementation', 'Scoring system development', 'Core game build deployment'] },
    { id: 'rm-m-3', quarter: 'Q3 2026', theme: 'Validation Testing & Field Trials', owner: 'Miral', activities: ['Ethical clearance submission', 'Pre/post-test instrument validation', 'Gameplay evaluation workshops with schools', 'Post-test audits and data aggregation'] },
    { id: 'rm-m-4', quarter: 'Q4 2026/2027', theme: 'Refinement & Public Release', owner: 'Miral', activities: ['Game adjustment based on field validation', 'Sustainability framework document construction', 'Final project reports and documentation', 'Public web release deployment'] },

    // Shalini's roadmap
    { id: 'rm-s-1', quarter: 'Q1 2026', theme: 'Research Foundation, System Design, and Functional Pilot', owner: 'Shalini', activities: ['Literature review of HEC coexistence practices & Generative AI model architectures', 'Ethical considerations & regulatory framework evaluation', 'Draft datasets assembly', 'System architectural design specifications', 'Functional pilot demo setup'] },
    { id: 'rm-s-2', quarter: 'Q2 2026', theme: 'Empirical Fieldwork and Datasets assembly', owner: 'Shalini', activities: ['Ethics review submission & field deployment logistics', 'Primary qualitative coexistence data extraction in fields', 'Social media contextual crawl', 'Transcription & translation pipeline'] },
    { id: 'rm-s-3', quarter: 'Q3 2026', theme: 'Preprocessing, Classification, annotation', owner: 'Shalini', activities: ['Data sanitation & qualitative annotation coding', 'Classification logic maps setup', 'Follow-up field validation trips', 'Generative model training parameter configuration'] },
    { id: 'rm-s-4', quarter: 'Q4 2026/2027', theme: 'Model Training, Optimization, Deployment', owner: 'Shalini', activities: ['Fine-tuning coexistence model layers', 'Iterative evaluation metrics verification', 'Initial hosting environment provisioning', 'Beta user acceptance feedback reviews'] },
    { id: 'rm-s-5', quarter: 'Q1 2027', theme: 'UAT & Final Release Deployments', owner: 'Shalini', activities: ['Automation test configurations (regression mapping)', 'Ethical alignment audits', 'Final UAT report synthesis', 'Workspace closure & publishing activities'] }
  ],
  meetings: generateRecurringMeetings(),
  tasks: [
    {
      id: 'tsk-1',
      identifier: 'TSK-001',
      title: 'Draft initial HEC metrics schema',
      status: 'Done',
      priority: 'High',
      assignee: 'Miral',
      date: getRelativeDateStr(-5),
      labels: ['Data', 'Research']
    },
    {
      id: 'tsk-2',
      identifier: 'TSK-002',
      title: 'Review generative AI ethical guidelines',
      status: 'In Progress',
      priority: 'Urgent',
      assignee: 'Shalini',
      date: getRelativeDateStr(-2),
      labels: ['Compliance']
    },
    {
      id: 'tsk-3',
      identifier: 'TSK-003',
      title: 'Design serious game UI wireframes',
      status: 'In Progress',
      priority: 'High',
      assignee: 'Miral',
      date: getRelativeDateStr(2),
      labels: ['Design', 'UX']
    },
    {
      id: 'tsk-4',
      identifier: 'TSK-004',
      title: 'Assemble preliminary field datasets',
      status: 'Todo',
      priority: 'Medium',
      assignee: 'Shalini',
      date: getRelativeDateStr(5),
      labels: ['Data']
    },
    {
      id: 'tsk-5',
      identifier: 'TSK-005',
      title: 'Implement player scoring system logic',
      status: 'Todo',
      priority: 'Low',
      assignee: 'Miral',
      date: getRelativeDateStr(10),
      labels: ['Development']
    },
    {
      id: 'tsk-6',
      identifier: 'TSK-006',
      title: 'Explore Unity particle systems for foliage',
      status: 'Backlog',
      priority: 'No priority',
      assignee: 'Miral',
      date: '',
      labels: ['Exploration']
    }
  ]
};
