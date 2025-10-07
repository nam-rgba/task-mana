import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'tasks' })
export class Task {
	@PrimaryGeneratedColumn('uuid')
	id!: string

	@Column({ type: 'varchar', length: 255 })
	title!: string

	@Column({ type: 'text', nullable: true })
	description?: string

	@Column({ type: 'boolean', default: false })
	completed!: boolean

	@Column({ type: 'timestamp', nullable: true })
	dueDate?: Date

	@CreateDateColumn({ name: 'created_at' })
	createdAt!: Date

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt!: Date
}
