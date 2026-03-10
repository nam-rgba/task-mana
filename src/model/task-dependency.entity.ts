import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique, Check } from 'typeorm'
import { Task } from './task.entity.js'
import { DependencyType } from './enums/gantt.enum.js'

@Entity('task_dependencies')
@Unique(['predecessorId', 'successorId'])
@Check(`"predecessorId" != "successorId"`)
export class TaskDependency {
	@PrimaryGeneratedColumn()
	id: number

	@Column({ type: 'int' })
	predecessorId: number

	@ManyToOne(() => Task, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'predecessorId' })
	predecessor: Task

	@Column({ type: 'int' })
	successorId: number

	@ManyToOne(() => Task, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'successorId' })
	successor: Task

	@Column({ type: 'enum', enum: DependencyType, default: DependencyType.FS })
	type: DependencyType

	@Column({ type: 'int', default: 0 })
	lagDays: number

	@CreateDateColumn({ type: 'timestamptz' })
	createdAt: Date
}
