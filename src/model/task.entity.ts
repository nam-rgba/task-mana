import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn
} from 'typeorm'
import { TaskPriority, TaskStatus, TaskType } from '~/types/task.type.js'
import { User } from './user.entity.js'

@Entity({ name: 'tasks' })
export class Task {
	@PrimaryGeneratedColumn()
	id: number

	@Column({ type: 'varchar', length: 255 })
	title!: string

	@Column({ type: 'text', nullable: true })
	description?: string

	@Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.Pending })
	status!: TaskStatus

	@Column({ type: 'enum', enum: TaskType, default: TaskType.Feature })
	type!: TaskType

	@Column({ type: 'int', nullable: true })
	dueDate?: number

	@Column({ type: 'float', default: 0 })
	estimateEffort: number

	@Column({ type: 'float', default: 0 })
	actualEffort: number

	@Column({ type: 'int', nullable: true })
	assigneeId?: number

	@ManyToOne(() => User, { eager: false })
	@JoinColumn({ name: 'assigneeId' })
	assignee?: User

	@Column({ type: 'int', nullable: true })
	reviewerId?: number

	@ManyToOne(() => User, { eager: false })
	@JoinColumn({ name: 'reviewerId' })
	reviewer?: User

	@Column({ type: 'int', nullable: true })
	projectId?: number

	@Column({ type: 'uuid', nullable: true })
	parentTaskId?: string

	@Column({ type: 'enum', enum: TaskPriority, nullable: true })
	priority?: string

	@Column({ type: 'int', nullable: true })
	completedPercent?: number

	@Column({ type: 'int', nullable: true })
	completedAt?: number

	@Column('text', { array: true, nullable: true })
	fileUrls: string[]

	@CreateDateColumn({ name: 'created_at' })
	createdAt!: Date

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt!: Date
}
