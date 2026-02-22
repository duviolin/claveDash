export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'DIRECTOR'
export type UserStatus = 'ACTIVE' | 'SUSPENDED'
export type CourseType = 'MUSIC' | 'THEATER'
export type SeasonStatus = 'PLANNED' | 'ACTIVE' | 'CLOSED'
export type ProjectType = 'ALBUM' | 'PLAY'
export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED'
export type TrackSceneStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type TrackMaterialType = 'PDF' | 'AUDIO' | 'VIDEO' | 'TEXT' | 'LINK'
export type DailyMissionTemplateStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type SubmissionStatus = 'PENDING' | 'PENDING_REVIEW' | 'APPROVED' | 'NEEDS_REVISION' | 'REJECTED'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  mustChangePassword: boolean
  createdAt: string
  updatedAt: string
}

export interface School {
  id: string
  name: string
  directorId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Course {
  id: string
  schoolId: string
  name: string
  type: CourseType
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Season {
  id: string
  courseId: string
  name: string
  startDate: string
  endDate: string
  status: SeasonStatus
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Class {
  id: string
  seasonId: string
  name: string
  maxStudents: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProjectTemplate {
  id: string
  courseId: string
  name: string
  type: ProjectType
  description: string | null
  coverImage: string | null
  version: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TrackSceneTemplate {
  id: string
  projectTemplateId: string
  title: string
  artist: string | null
  description: string | null
  technicalInstruction: string | null
  lyrics: string | null
  order: number
  demoRequired: boolean
  pressQuizRequired: boolean
  isActive: boolean
  version: number
  createdAt: string
}

export interface TrackMaterialTemplate {
  id: string
  trackSceneTemplateId: string
  type: TrackMaterialType
  title: string
  defaultContentUrl: string | null
  defaultTextContent: string | null
  order: number
  isRequired: boolean
  isActive: boolean
  version: number
  createdAt: string
  updatedAt: string
}

export interface StudyTrackCategory {
  id: string
  courseId: string
  name: string
  key: string
  icon: string | null
  color: string | null
  description: string | null
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface StudyTrackTemplate {
  id: string
  trackSceneTemplateId: string
  categoryId: string | null
  categoryKey: string | null
  title: string
  description: string | null
  technicalNotes: string | null
  videoUrl: string | null
  audioUrl: string | null
  pdfUrl: string | null
  order: number
  estimatedMinutes: number
  isRequired: boolean
  isVisible: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PressQuizTemplate {
  id: string
  trackSceneTemplateId: string
  title: string
  description: string | null
  questionsJson: QuizQuestion[] | null
  maxAttempts: number
  passingScore: number
  version: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface DailyMissionTemplate {
  id: string
  courseId: string
  title: string
  videoUrl: string | null
  order: number
  status: DailyMissionTemplateStatus
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface DailyMissionQuiz {
  id: string
  dailyMissionId: string
  version: number
  questionsJson: QuizQuestion[] | null
  maxAttemptsPerDay: number
  allowRecoveryAttempt: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
}

export interface Project {
  id: string
  templateId: string
  classId: string
  seasonId: string
  name: string
  description: string | null
  coverImage: string | null
  status: ProjectStatus
  isVisible: boolean
  releasedAt: string | null
  projectTemplateVersion: number
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface StudentProfile {
  id: string
  userId: string
  stageName: string
  avatarUrl: string | null
  bio: string | null
  createdAt: string
}

export interface TeacherProfile {
  id: string
  userId: string
  avatarUrl: string | null
  bio: string | null
  createdAt: string
}

export interface StorageConfig {
  fileType: string
  maxSizeMB: number
  maxSizeBytes: number
  allowedMimeTypes: string[]
  allowedExtensions: string[]
}

export interface PresignUploadResponse {
  uploadUrl: string
  key: string
  expiresIn: number
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  data: Record<string, unknown> | null
  isRead: boolean
  createdAt: string
}

export interface MeResponse {
  user: AuthUser
  profile: StudentProfile | TeacherProfile | null
  context: {
    schoolId: string | null
    courseId: string | null
    seasonId: string | null
    classId: string | null
  }
}

export interface ApiError {
  error: string
}
