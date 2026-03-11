import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { AppBaseEntity } from './base.entity.js'
import { Project } from './project.entity.js'
import { Task } from './task.entity.js'
import { DocumentType } from './enums/document.enum.js'

@Entity('documents')
export class Document extends AppBaseEntity {
	@Column({ type: 'varchar', length: 255 })
	name: string

	@Column({ type: 'text' })
	url: string

	@Column({ type: 'varchar', length: 100, nullable: true })
	mimeType?: string

	@Column({ type: 'int', nullable: true })
	size?: number

	@Column({ type: 'enum', enum: DocumentType })
	type: DocumentType

	@Column({ type: 'int' })
	projectId?: number

	@ManyToOne(() => Project, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'projectId' })
	project?: Project

	@Column({ type: 'int', nullable: true })
	taskId?: number

	@ManyToOne(() => Task, { nullable: true, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'taskId' })
	task?: Task

	@Column({ type: 'int', nullable: true })
	uploadedById?: number
}
