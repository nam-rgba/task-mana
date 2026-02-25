import { Entity, Column, Index, OneToMany, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm'
import { AppBaseEntity } from './base.entity.js'
import { TeamMember } from './teamMember.entity.js'
import { User } from './user.entity.js'
import { Project } from './project.entity.js'

@Entity('teams')
export class Team extends AppBaseEntity {
	@Index({ unique: true })
	@Column({ type: 'varchar', length: 50 })
	key: string // VD: "DEV", "MKT", "OPS"

	@Column({ type: 'varchar', length: 150 })
	name: string

	@Column({ type: 'varchar', length: 255, nullable: true })
	description?: string

	@Column({ type: 'varchar', length: 7, nullable: true })
	color?: string // #RRGGBB

	@Column({ type: 'varchar', length: 255, nullable: true })
	avatarUrl?: string

	@ManyToOne(() => User, { nullable: true })
	@JoinColumn({ name: 'leadId' })
	lead?: Awaited<User>

	@Column({ type: 'int', nullable: true })
	leadId?: number

	@Column({ type: 'boolean', default: true })
	isActive: boolean

	// Setting nâng cao
	@Column({ type: 'jsonb', nullable: true })
	settings?: {
		defaultProjectTemplate?: string // "SOFTWARE", "BUSINESS", ...
		workingDays?: number[] // 1-7
		timezone?: string
		notificationChannel?: string // Slack/Webhook/Email, etc.
	}

	@OneToMany(() => TeamMember, (tm) => tm.team)
	members: Awaited<TeamMember[]>

	@OneToMany(() => Project, (project) => project.team)
	projects: Awaited<Project[]>

	@Column({ type: 'varchar', nullable: true, length: 20 })
	discordServerId: string

	@Column({ type: 'boolean', default: false })
	isDiscordServerLinked: boolean
}
