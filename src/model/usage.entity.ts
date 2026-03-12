import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { ApiKey } from './api-key.entity.js'
import { RequestScope } from '~/services/usage-tracking.service.js'

@Entity('usages')
export class Usage {
	@PrimaryGeneratedColumn()
	id: number

	@Column({ type: 'int' })
	apiKeyId: number

	@ManyToOne(() => ApiKey, (apiKey) => apiKey.usages, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'apiKeyId' })
	apiKey: Awaited<ApiKey>

	@Column({ type: 'varchar', length: 20 })
	requestScope: RequestScope

	@Column({ type: 'int', nullable: true })
	promptTokens: number | null

	@Column({ type: 'int', nullable: true })
	completionTokens: number | null

	@Column({ type: 'int', nullable: true })
	totalTokens: number | null

	@Column({ type: 'int', nullable: true })
	reasoningTokens: number | null

	@Column({ type: 'float', nullable: true })
	promptTime: number | null

	@Column({ type: 'float', nullable: true })
	completionTime: number | null

	@Column({ type: 'float', nullable: true })
	totalTime: number | null

	@Column({ type: 'varchar', length: 20, default: 'chat' })
	requestType: 'chat' | 'vision'

	@Column({ type: 'jsonb', nullable: true })
	metadata: Record<string, unknown> | null

	@CreateDateColumn({ type: 'timestamptz' })
	createdAt!: Date
}
