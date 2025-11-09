import { Entity, ManyToOne, Column, Unique, JoinColumn } from 'typeorm'
import { AppBaseEntity } from './base.entity.js'
import { Team } from './Team.entity.js'
import { User } from './User.js'
import { TeamMemberRole } from './enums/team-role.enum.js'

@Entity('team_members')
@Unique(['teamId', 'userId'])
export class TeamMember extends AppBaseEntity {
	@ManyToOne(() => Team, (team) => team.members, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'teamId' })
	team: Team

	@Column({ type: 'uuid' })
	teamId: string

	@ManyToOne(() => User, (user) => user.teamMemberships, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'userId' })
	user: User

	@Column({ type: 'uuid' })
	userId: string

	@Column({
		type: 'enum',
		enum: TeamMemberRole,
		default: TeamMemberRole.MEMBER
	})
	role: TeamMemberRole

	@Column({ type: 'boolean', default: true })
	isActive: boolean
}
