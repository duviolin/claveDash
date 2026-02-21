import { api } from './client'

export interface StudentProfile {
  id: string
  userId: string
  stageName: string
  avatarUrl: string | null
  bio: string | null
}

export interface TeacherProfile {
  id: string
  userId: string
  avatarUrl: string | null
  bio: string | null
}

// --- Student Profile ---
export async function getStudentProfile(userId: string) {
  const { data } = await api.get<StudentProfile>(`/students/${userId}/profile`)
  return data
}

export async function createStudentProfile(userId: string, payload: { stageName: string; avatarUrl?: string; bio?: string }) {
  const { data } = await api.post<StudentProfile>(`/students/${userId}/profile`, payload)
  return data
}

export async function updateStudentProfile(userId: string, payload: { stageName?: string; avatarUrl?: string; bio?: string }) {
  const { data } = await api.patch<StudentProfile>(`/students/${userId}/profile`, payload)
  return data
}

// --- Teacher Profile ---
export async function getTeacherProfile(userId: string) {
  const { data } = await api.get<TeacherProfile>(`/teachers/${userId}/profile`)
  return data
}

export async function createTeacherProfile(userId: string, payload: { avatarUrl?: string; bio?: string }) {
  const { data } = await api.post<TeacherProfile>(`/teachers/${userId}/profile`, payload)
  return data
}

export async function updateTeacherProfile(userId: string, payload: { avatarUrl?: string; bio?: string }) {
  const { data } = await api.patch<TeacherProfile>(`/teachers/${userId}/profile`, payload)
  return data
}
