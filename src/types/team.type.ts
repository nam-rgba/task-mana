import { User } from './user.type.js'

// shared/types/team.interface.ts

export interface Team {
	id: number
	key: string
	name: string
	description?: string
	avatarUrl?: string
	leadId?: number
	isActive: boolean

	// Quan hệ (chỉ nên expose ở mức tối giản)
	lead?: User
	members?: User[]

	projects?: {
		id: number
		name: string
		key: string
	}[]

	// Từ AppBaseEntity
	createdAt: string
	updatedAt: string
}
