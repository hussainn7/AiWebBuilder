import { Task, Client, Project, User, TasksByStatus } from './types';

// Mock Users
export const users: User[] = [
  {
    id: 'u1',
    name: 'Анна Петрова',
    email: 'anna@taskpulse.com',
    role: 'team-lead',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
  },
  {
    id: 'u2',
    name: 'Иван Смирнов',
    email: 'ivan@taskpulse.com',
    role: 'employee',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
  },
  {
    id: 'u3',
    name: 'Елена Козлова',
    email: 'elena@taskpulse.com',
    role: 'employee',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
  },
  {
    id: 'u4',
    name: 'Дмитрий Иванов',
    email: 'dmitry@taskpulse.com',
    role: 'employee',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
  },
  {
    id: 'u5',
    name: 'Мария Сидорова',
    email: 'maria@taskpulse.com',
    role: 'employee',
    avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
  },
];

// Mock Clients
export const clients: Client[] = [
  {
    id: 'c1',
    name: 'ТехноПром',
    contactInfo: 'Алексей Васильев, +7 (900) 123-4567',
    description: 'Крупная технологическая компания, специализирующаяся на программном обеспечении',
    links: ['https://technoprom.ru', 'https://instagram.com/technoprom'],
    status: 'active',
  },
  {
    id: 'c2',
    name: 'ЭкоФуд',
    contactInfo: 'Мария Романова, maria@ecofood.com',
    description: 'Сеть магазинов органических продуктов',
    links: ['https://ecofood.ru', 'https://vk.com/ecofood'],
    status: 'active',
  },
  {
    id: 'c3',
    name: 'ФитнесГуру',
    contactInfo: 'Сергей Морозов, +7 (900) 765-4321',
    description: 'Сеть фитнес-центров премиум класса',
    links: ['https://fitnessguru.ru'],
    status: 'inactive',
  },
];

// Mock Projects
export const projects: Project[] = [
  {
    id: 'p1',
    name: 'Летняя кампания ТехноПром',
    description: 'Рекламная кампания новой линейки продуктов',
    clientId: 'c1',
    status: 'active',
    startDate: '2025-03-01',
  },
  {
    id: 'p2',
    name: 'Запуск приложения ЭкоФуд',
    description: 'Маркетинговая поддержка запуска мобильного приложения',
    clientId: 'c2',
    status: 'active',
    startDate: '2025-03-15',
  },
  {
    id: 'p3',
    name: 'Ребрендинг ФитнесГуру',
    description: 'Полное обновление визуального стиля',
    clientId: 'c3',
    status: 'on-hold',
    startDate: '2025-02-01',
  },
];

// Mock Comments
const comments: Comment[] = [
  {
    id: 'com1',
    userId: 'u1',
    content: 'Нужно ускорить выполнение этой задачи.',
    createdAt: '2025-04-05T10:30:00Z',
    user: users[0],
  },
  {
    id: 'com2',
    userId: 'u2',
    content: 'Работаю над этим, будет готово к вечеру.',
    createdAt: '2025-04-05T11:15:00Z',
    user: users[1],
  },
  {
    id: 'com3',
    userId: 'u3',
    content: 'Добавила новые идеи в документ.',
    createdAt: '2025-04-06T09:45:00Z',
    user: users[2],
  },
];

// Mock Subtasks
const subtasks: SubTask[] = [
  {
    id: 'st1',
    title: 'Подготовить текст для публикации',
    completed: true,
  },
  {
    id: 'st2',
    title: 'Создать дизайн баннера',
    completed: false,
  },
  {
    id: 'st3',
    title: 'Согласовать с клиентом',
    completed: false,
  },
];

// Mock Tasks
export const tasks: Task[] = [
  {
    id: 't1',
    title: 'Создать контент-план для Instagram',
    description: 'Разработать план публикаций на месяц вперед с учетом запуска новой линейки продуктов',
    status: 'in-progress',
    dueDate: '2025-04-25T00:00:00Z',
    assignees: [users[1], users[2]],
    createdBy: users[0].id,
    clientId: 'c1',
    projectId: 'p1',
    subTasks: [subtasks[0], subtasks[1], subtasks[2]],
    comments: [comments[0], comments[1]],
    attachments: ['https://example.com/file1.pdf'],
    createdAt: '2025-04-01T09:00:00Z',
    updatedAt: '2025-04-05T14:30:00Z',
    editHistory: [
      {
        userId: users[0].id,
        timestamp: '2025-04-01T09:00:00Z',
        changes: 'Создана задача',
      },
      {
        userId: users[1].id,
        timestamp: '2025-04-05T14:30:00Z',
        changes: 'Обновлено описание',
      },
    ],
  },
  {
    id: 't2',
    title: 'Разработать креативы для рекламы в Facebook',
    description: 'Создать 5 рекламных креативов для продвижения приложения',
    status: 'draft',
    dueDate: '2025-05-10T00:00:00Z',
    assignees: [users[3]],
    createdBy: users[0].id,
    clientId: 'c2',
    projectId: 'p2',
    subTasks: [],
    comments: [],
    attachments: [],
    createdAt: '2025-04-10T10:15:00Z',
    updatedAt: '2025-04-10T10:15:00Z',
    editHistory: [
      {
        userId: users[0].id,
        timestamp: '2025-04-10T10:15:00Z',
        changes: 'Создана задача',
      },
    ],
  },
  {
    id: 't3',
    title: 'Подготовить отчет по результатам кампании',
    description: 'Составить отчет о результатах рекламной кампании за прошлый месяц',
    status: 'completed',
    dueDate: '2025-04-05T00:00:00Z',
    assignees: [users[4]],
    createdBy: users[0].id,
    clientId: 'c1',
    projectId: 'p1',
    subTasks: [],
    comments: [comments[2]],
    attachments: ['https://example.com/report.xlsx'],
    createdAt: '2025-03-25T11:00:00Z',
    updatedAt: '2025-04-04T16:45:00Z',
    editHistory: [
      {
        userId: users[0].id,
        timestamp: '2025-03-25T11:00:00Z',
        changes: 'Создана задача',
      },
      {
        userId: users[4].id,
        timestamp: '2025-04-04T16:45:00Z',
        changes: 'Изменен статус на "completed"',
      },
    ],
  },
  {
    id: 't4',
    title: 'Создать шаблоны для Stories',
    description: 'Разработать 10 шаблонов для Instagram Stories в соответствии с новым стилем бренда',
    status: 'under-review',
    dueDate: '2025-04-18T00:00:00Z',
    assignees: [users[2], users[3]],
    createdBy: users[0].id,
    clientId: 'c3',
    projectId: 'p3',
    subTasks: [],
    comments: [],
    attachments: ['https://example.com/templates.zip'],
    createdAt: '2025-04-03T13:20:00Z',
    updatedAt: '2025-04-15T09:10:00Z',
    editHistory: [
      {
        userId: users[0].id,
        timestamp: '2025-04-03T13:20:00Z',
        changes: 'Создана задача',
      },
      {
        userId: users[2].id,
        timestamp: '2025-04-15T09:10:00Z',
        changes: 'Изменен статус на "under-review"',
      },
    ],
  },
  {
    id: 't5',
    title: 'Анализ конкурентов',
    description: 'Провести анализ стратегий в соцсетях трех основных конкурентов',
    status: 'canceled',
    dueDate: '2025-04-12T00:00:00Z',
    assignees: [users[1]],
    createdBy: users[0].id,
    clientId: 'c2',
    projectId: 'p2',
    subTasks: [],
    comments: [],
    attachments: [],
    createdAt: '2025-04-02T15:30:00Z',
    updatedAt: '2025-04-08T11:20:00Z',
    editHistory: [
      {
        userId: users[0].id,
        timestamp: '2025-04-02T15:30:00Z',
        changes: 'Создана задача',
      },
      {
        userId: users[0].id,
        timestamp: '2025-04-08T11:20:00Z',
        changes: 'Изменен статус на "canceled"',
      },
    ],
  },
  {
    id: 't6',
    title: 'Спланировать фотосессию продукции',
    description: 'Организовать фотосессию новых продуктов для социальных сетей',
    status: 'in-progress',
    dueDate: '2025-04-30T00:00:00Z',
    assignees: [users[4], users[2]],
    createdBy: users[0].id,
    clientId: 'c1',
    projectId: 'p1',
    subTasks: [],
    comments: [],
    attachments: ['https://example.com/photo-brief.pdf'],
    createdAt: '2025-04-11T10:00:00Z',
    updatedAt: '2025-04-11T10:00:00Z',
    editHistory: [
      {
        userId: users[0].id,
        timestamp: '2025-04-11T10:00:00Z',
        changes: 'Создана задача',
      },
    ],
  },
];

export const getTasksByStatus = () => {
  const tasksByStatus = {
    draft: tasks.filter(task => task.status === 'draft'),
    'in-progress': tasks.filter(task => task.status === 'in-progress'),
    'under-review': tasks.filter(task => task.status === 'under-review'),
    completed: tasks.filter(task => task.status === 'completed'),
    canceled: tasks.filter(task => task.status === 'canceled'),
  };
  
  return tasksByStatus;
};

export const getClientById = (id: string) => {
  return clients.find(client => client.id === id);
};

export const getProjectById = (id: string) => {
  return projects.find(project => project.id === id);
};

export const getUserById = (id: string) => {
  return users.find(user => user.id === id);
};

// Helper to get task with related data
export const getEnhancedTasks = () => {
  return tasks.map(task => {
    // Add client and project objects
    if (task.clientId) {
      task.client = getClientById(task.clientId);
    }
    
    if (task.projectId) {
      task.project = getProjectById(task.projectId);
    }
    
    return task;
  });
};

// Add functions to support adding new entities to mock data
export function addClientToMockData(newClient: Client) {
  clients.push(newClient);
}

export function addProjectToMockData(newProject: Project) {
  projects.push(newProject);
}

export function addTaskToMockData(newTask: Task) {
  tasks.push(newTask);
}
