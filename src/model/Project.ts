import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'projects' })
export class Project {
	@PrimaryGeneratedColumn('uuid')
	id!: string

	@Column({ type: 'varchar', length: 255 })
	name!: string

	@Column({ type: 'text', nullable: true })
	description?: string

	@Column({ type: 'timestamp', nullable: true })
	startDate?: Date

	@Column({ type: 'timestamp', nullable: true })
	endDate?: Date
}
