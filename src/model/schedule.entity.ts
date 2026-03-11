import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm'
import { AppBaseEntity } from './base.entity.js'
import { Project } from './project.entity.js'
import { Task } from './task.entity.js'
import { ScheduleStatus } from './enums/gantt.enum.js'

@Entity('schedules')
export class Schedule extends AppBaseEntity {
	@Column({ type: 'varchar', length: 200 })
	name: string

	@Column({ type: 'text', nullable: true })
	description?: string

	@Column({ type: 'int' })
	startDate: number

	@Column({ type: 'int' })
	endDate: number

	@Column({ type: 'enum', enum: ScheduleStatus, default: ScheduleStatus.PLANNED })
	status: ScheduleStatus

	@Column({ type: 'varchar', length: 7, default: '#6366f1' })
	color: string

	@Column({ type: 'int' })
	projectId: number

	@ManyToOne(() => Project, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'projectId' })
	project: Awaited<Project>

	@Column({ type: 'int', default: 0 })
	sortOrder: number

	@OneToMany(() => Task, (task) => task.schedule)
	tasks: Awaited<Task[]>
}
