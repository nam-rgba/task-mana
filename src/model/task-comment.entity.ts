import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { AppBaseEntity } from './base.entity.js'
import { Task } from './task.entity.js'
import { User } from './user.entity.js'
import { Document } from './document.entity.js'

@Entity('task_comments')
export class TaskComment extends AppBaseEntity {
	@Column({ type: 'int' })
	taskId: number

	@ManyToOne(() => Task, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'taskId' })
	task: Task

	@Column({ type: 'int' })
	authorId: number

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'authorId' })
	author: User

	@Column({ type: 'text', nullable: true })
	content?: string

	@Column({ type: 'int', nullable: true })
	documentId?: number

	@ManyToOne(() => Document, { nullable: true, onDelete: 'SET NULL' })
	@JoinColumn({ name: 'documentId' })
	document?: Document
}
