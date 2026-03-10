import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { AppBaseEntity } from './base.entity.js'
import { Project } from './project.entity.js'
import { Schedule } from './schedule.entity.js'
import { MilestoneStatus } from './enums/gantt.enum.js'

@Entity('milestones')
export class Milestone extends AppBaseEntity {
	@Column({ type: 'varchar', length: 200 })
	name: string

	@Column({ type: 'text', nullable: true })
	description?: string

	@Column({ type: 'int' })
	dueDate: number

	@Column({ type: 'enum', enum: MilestoneStatus, default: MilestoneStatus.PENDING })
	status: MilestoneStatus

	@Column({ type: 'varchar', length: 7, default: '#f59e0b' })
	color: string

	@Column({ type: 'int' })
	projectId: number

	@ManyToOne(() => Project, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'projectId' })
	project: Project

	@Column({ type: 'int', nullable: true })
	scheduleId?: number

	@ManyToOne(() => Schedule, { nullable: true, onDelete: 'SET NULL' })
	@JoinColumn({ name: 'scheduleId' })
	schedule?: Schedule

	@Column({ type: 'int', default: 0 })
	sortOrder: number
}
