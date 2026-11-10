import type { Me } from '../../shared/types/api'

export type MockAccount = {
  email: string
  password: string
  user: Me
}

export const mockAuthAccounts: MockAccount[] = [
  {
    email: 'mock.admin@niogabay.local',
    password: 'Admin123!',
    user: {
      id: '00000000-0000-0000-0000-0000000000aa',
      email: 'mock.admin@niogabay.local',
      full_name: 'Mock System Administrator',
      position_title: 'System Administrator',
      role: 'admin'
    }
  },
  {
    email: 'mock.staff@niogabay.local',
    password: 'Staff123!',
    user: {
      id: '00000000-0000-0000-0000-0000000000ee',
      email: 'mock.staff@niogabay.local',
      full_name: 'Mock Staff Member',
      position_title: 'Barangay Clerk',
      role: 'staff'
    }
  }
]

export const findMockAccount = (email: string, password: string) =>
  mockAuthAccounts.find(account => account.email === email && account.password === password) ?? null

export const findMockAccountById = (id: string) =>
  mockAuthAccounts.find(account => account.user.id === id) ?? null
