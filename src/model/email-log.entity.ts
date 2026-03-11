import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity('email_logs')
export class EmailLog {
	@PrimaryGeneratedColumn()
	id: number

	@Index()
	@Column({ type: 'int', nullable: true })
	userId?: number

	@Column({ type: 'varchar', length: 255 })
	toEmail: string

	@Column({ type: 'varchar', length: 255 })
	subject: string

	@Column({ type: 'varchar', length: 100 })
	templateName: string

	@Column({ type: 'varchar', length: 20 })
	status: 'SENT' | 'FAILED'

	@Column({ type: 'text', nullable: true })
	errorMessage?: string | null

	@Column({ type: 'jsonb', nullable: true })
	payload?: Record<string, any>

	@CreateDateColumn({ type: 'timestamptz' })
	createdAt: Date
}
