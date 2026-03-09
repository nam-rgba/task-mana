import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm'
import { Position } from '~/types/position.type.js'
import { TeamMember } from './teamMember.entity.js'
import { Project } from './project.entity.js'
import { Subscription } from './subscription.entity.js'
import { Order } from './order.entity.js'
import { AuthProvider } from './enums/auth-provider.enum.js'

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

	@CreateDateColumn()
	createdAt!: Date

	@UpdateDateColumn()
	updatedAt!: Date
}
