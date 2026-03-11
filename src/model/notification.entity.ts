import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm'
import { User } from './user.entity.js'

@Entity('notifications')
export class Notification {
	@PrimaryGeneratedColumn()
	id: number

	@Index()
	@Column({ type: 'int' })
	userId: number

	@ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'userId' })
	user?: User

	@Column({ type: 'varchar', length: 64 })
	type: string

	@Column({ type: 'varchar', length: 255 })
	title: string

	@Column({ type: 'text' })
	content: string

	@Column({ type: 'boolean', default: false })
	isRead: boolean

	@Column({ type: 'timestamptz', nullable: true })
	readAt?: Date | null

	@Column({ type: 'jsonb', nullable: true })
	metadata?: Record<string, any>

	@CreateDateColumn({ type: 'timestamptz' })
	createdAt: Date

	@UpdateDateColumn({ type: 'timestamptz' })
	updatedAt: Date
}
