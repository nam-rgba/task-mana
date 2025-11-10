import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm'
import { Position } from '~/types/position.type.js'
import { TeamMember } from './teamMember.entity.js'
import { Project } from './project.entity.js'

@Entity('users')
export class User {
	@PrimaryGeneratedColumn()
	id: number

	@Index()
	@Column({ type: 'varchar', length: 225, unique: true })
	email: string

	@Column({ type: 'varchar' })
	password: string

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
	teamMemberships: TeamMember[]

	@OneToMany(() => Project, (p) => p.lead)
	leadingProjects: Project[]

	@CreateDateColumn()
	createdAt!: Date

	@UpdateDateColumn()
	updatedAt!: Date
}
