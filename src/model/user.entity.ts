import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	Index,
	OneToMany,
	ManyToOne,
	JoinColumn
} from 'typeorm'
import { Position } from '~/types/position.type.js'
import { TeamMember } from './teamMember.entity.js'
import { Project } from './project.entity.js'
import { Subscription } from './subscription.entity.js'
import { Order } from './order.entity.js'
import { AuthProvider } from './enums/auth-provider.enum.js'
import { ApiKey } from './api-key.entity.js'
import { UserSkill } from './user-skill.entity.js'

@Entity('users')
export class User {
	@PrimaryGeneratedColumn()
	id: number

	@Index()
	@Column({ type: 'varchar', length: 225, unique: true })
	email: string

	@Column({ type: 'varchar', nullable: true })
	password: string | null

	@Column({ type: 'varchar', default: '' })
	name: string

	@Column({ type: 'varchar', nullable: true })
	avatar: string

	@Column({ type: 'varchar', nullable: true })
	position: Position

	@Column({ type: 'float', nullable: false, default: 0 })
	yearOfExperience: number

	skills?: string[]

	@OneToMany(() => UserSkill, (us) => us.user)
	userSkills: Awaited<UserSkill[]>

	// team, 1 user có thể ở trong nhiều team 1 lúc
	@OneToMany(() => TeamMember, (tm) => tm.user)
	teamMemberships: Awaited<TeamMember[]>

	@OneToMany(() => Project, (p) => p.lead)
	leadingProjects: Awaited<Project[]>

	@Column({ type: 'varchar', nullable: true, length: 20 })
	discordUserId: string

	@OneToMany(() => Subscription, (sub) => sub.user)
	subscriptions: Awaited<Subscription[]>

	@OneToMany(() => Order, (order) => order.user)
	orders: Awaited<Order[]>

	@Column({ type: 'boolean', default: false })
	isEmailVerified: boolean

	@Column({ type: 'varchar', default: AuthProvider.LOCAL })
	authProvider: AuthProvider

	@OneToMany(() => ApiKey, (apiKey) => apiKey.user)
	apiKeys: Awaited<ApiKey[]>

	@Column({ type: 'int', nullable: true })
	selectedApiKeyId: number | null

	@ManyToOne(() => ApiKey, { nullable: true, onDelete: 'SET NULL' })
	@JoinColumn({ name: 'selectedApiKeyId' })
	selectedApiKey: Awaited<ApiKey> | null

	@CreateDateColumn()
	createdAt!: Date

	@UpdateDateColumn()
	updatedAt!: Date
}
