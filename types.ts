export enum AppView {
  DASHBOARD = 'DASHBOARD',
  PLAN_LIST = 'PLAN_LIST',
  PLAN_CREATE = 'PLAN_CREATE',
  LEARNING_PATH = 'LEARNING_PATH',
  TUTOR = 'TUTOR',
  JOB_MARKET = 'JOB_MARKET',
  NEWS = 'NEWS',
  REVIEW = 'REVIEW',
  INTERVIEW = 'INTERVIEW'
}

export interface Link {
  title: string;
  url: string;
}

export interface DailyTask {
  day: number;
  topic: string;
  description: string;
  tasks: string[];
  detailedContent?: string; 
  generatedLinks?: Link[];
  
  completed: boolean;
  score?: number;
  feedback?: string;
  userNotes?: string;
}

export interface StudyPlan {
  id: string;
  title: string;
  createdAt: number;
  targetRole: string;
  totalDays: number;
  overview: string;
  schedule: DailyTask[];
}

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  salary: string;
  location: string;
  tags: string[];
  description: {
    responsibilities: string[];
    requirements: string[];
    bonus?: string[];
    welfare?: string[];
  };
  url: string;
  source: string;
  publishDate: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUpdated: number;
}

export type ReviewCategoryType = 'LEETCODE' | 'INTERVIEW' | 'PROJECT';

export interface ReviewItem {
  id: string;
  category: ReviewCategoryType;
  title: string;
  content: string;
  lastModified: number;
}

export interface InterviewSession {
  id: string;
  role: string;
  startDate: number;
  messages: ChatMessage[];
  isFinished: boolean;
}

export interface NewsItem {
  title: string;
  summary: string;
  url?: string;
  source?: string;
}