import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn
} from 'typeorm'
import { TaskPriority, TaskStatus, TaskType, QCReviewStatus } from '~/types/task.type.js'
import { User } from './user.entity.js'
import { Project } from './project.entity.js'
import { Schedule } from './schedule.entity.js'

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
	startDate?: number

	@Column({ type: 'int', nullable: true })
	dueDate?: number

	@Column({ type: 'int', nullable: true })
	duration?: number

	@Column({ type: 'int', default: 0 })
	sortOrder: number

	@Column({ type: 'int', nullable: true })
	scheduleId?: number

	@ManyToOne(() => Schedule, { nullable: true, eager: false, onDelete: 'SET NULL' })
	@JoinColumn({ name: 'scheduleId' })
	schedule?: Awaited<Schedule>

	@Column({ type: 'float', default: 0 })
	estimateEffort: number

	@Column({ type: 'float', default: 0 })
	actualEffort: number

	@Column({ type: 'int', nullable: true })
	assigneeId?: number

	@ManyToOne(() => User, { eager: false })
	@JoinColumn({ name: 'assigneeId' })
	assignee?: Awaited<User>

	@Column({ type: 'int', nullable: true })
	reviewerId?: number

	@ManyToOne(() => User, { eager: false })
	@JoinColumn({ name: 'reviewerId' })
	reviewer?: Awaited<User>

	@Column({ type: 'int', nullable: true })
	projectId?: number

	@ManyToOne(() => Project, { eager: false })
	@JoinColumn({ name: 'projectId' })
	project?: Awaited<Project>

	@Column({ type: 'enum', enum: TaskPriority, nullable: true })
	priority?: string

	@Column({ type: 'int', nullable: true })
	completedPercent?: number

	@Column({ type: 'int', nullable: true })
	completedAt?: number

	@Column({ type: 'float', nullable: true })
	score?: number

	@Column({ type: 'enum', enum: QCReviewStatus, nullable: true })
	qcReviewStatus?: QCReviewStatus

	@Column({ type: 'text', nullable: true })
	qcNote?: string

	@Column('text', { array: true, nullable: true })
	fileUrls: string[]

	@CreateDateColumn({ name: 'created_at' })
	createdAt!: Date

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt!: Date

	@Column({ type: 'jsonb', nullable: true, default: [] })
	todos?: TodoItem[]

	// Document IDs for task description documents
	@Column('int', { array: true, nullable: true, default: [] })
	descriptionDocumentIds?: number[]

	// Document IDs for task result documents
	@Column('int', { array: true, nullable: true, default: [] })
	resultDocumentIds?: number[]
}

export interface TodoItem {
	id: string // UUID v4 generate từ client hoặc crypto.randomUUID()
	title: string
	order: number
	completed: boolean
}
