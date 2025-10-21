import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { TaskStatus } from '~/types/task.type.js'

@Entity({ name: 'tasks' })
export class Task {
	@PrimaryGeneratedColumn('uuid')
	id!: string

	@Column({ type: 'varchar', length: 255 })
	title!: string

	@Column({ type: 'text', nullable: true })
	description?: string

	@Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.Pending })
	status!: TaskStatus

	@Column({ type: 'timestamp', nullable: true })
	dueDate?: Date

	@Column({ type: 'float', default: 0 })
	estimateEffort: number

	@Column({ type: 'float', default: 0 })
	actualEffort: number

	@Column({ type: 'int', nullable: true })
	implementorId?: number

	@Column({ type: 'int', nullable: true })
	reviewerId?: number

	@Column({ type: 'int', nullable: true })
	projectId?: number

	@Column({ type: 'uuid', nullable: true })
	parentTaskId?: string

	@Column({ type: 'varchar', nullable: true })
	priority?: string

	@Column({ type: 'number', nullable: true })
	completedPercent?: number

	@Column({ type: 'timestamp', nullable: true })
	completedAt?: Date

	@Column('text', { array: true, nullable: true })
	fileUrls: string[]

	@CreateDateColumn({ name: 'created_at' })
	createdAt!: Date

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt!: Date
}
