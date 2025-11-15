// shared/types/teamMember.interface.ts
import { TeamMemberRole } from '~/model/enums/team-role.enum.js'
import { Team } from './team.type.js'
import { User } from './user.type.js'

export interface TeamMemberDto {
	id: number
	teamId: number
	userId: number
	role: TeamMemberRole
	isActive: boolean

	// Quan hệ mở rộng (optional cho FE)
	team?: Team

	user?: User

	createdAt: string
	updatedAt: string
}
