export type PageId =
  | 'dashboard'
  | 'learn'
  | 'selector'
  | 'calculator'
  | 'practice'
  | 'data'
  | 'visualize'
  | 'paper'
  | 'tutor'
  | 'mistakes'
  | 'progress'
  | 'settings'

export type LessonKind = 'concept' | 'method' | 'case'

export interface Lesson {
  id: string
  title: string
  kind: LessonKind
  duration: number
  summary: string
  explanation: string
  formula?: string
  caseStudy: string
  pitfalls: string[]
}

export interface Chapter {
  id: string
  number: number
  title: string
  subtitle: string
  color: string
  lessons: Lesson[]
}

export interface PracticeQuestion {
  id: string
  chapter: string
  type: '选择题' | '判断题' | '病例题'
  question: string
  options?: string[]
  answer: string
  explanation: string
  tag: string
}

export interface ProgressState {
  completedLessons: string[]
  completedQuestions: string[]
  mistakes: string[]
  bookmarkedLessons: string[]
  studyMinutes: number
  streak: number
  lastStudyDate?: string
}

export interface CalculationResult {
  method: string
  statistic?: number
  df?: number
  pValue?: number
  ci?: [number, number]
  effectSize?: number
  estimate?: number
  interpretation: string
  warnings: string[]
}
