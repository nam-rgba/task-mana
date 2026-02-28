import { Entity, Column, Index } from 'typeorm'
import { AppBaseEntity } from './base.entity.js'
import { PlanName } from './enums/billing.enum.js'

@Entity('plans')
export class Plan extends AppBaseEntity {
	@Index({ unique: true })
	@Column({ type: 'enum', enum: PlanName })
	name: PlanName

	@Column({ type: 'varchar', length: 100 })
	displayName: string

	@Column({ type: 'varchar', length: 500, nullable: true })
	description?: string

	@Column({ type: 'int', default: 0 })
	monthlyPrice: number // VNĐ

	@Column({ type: 'int', default: 0 })
	yearlyPrice: number // VNĐ

	@Column({ type: 'int', default: 5 })
	maxMembers: number

	@Column({ type: 'int', default: 3 })
	maxProjects: number

	@Column({ type: 'int', default: 500 })
	maxStorage: number // MB

	@Column({ type: 'jsonb', nullable: true })
	features?: {
		aiAssistant?: boolean
		advancedAnalytics?: boolean
		prioritySupport?: boolean
		customBranding?: boolean
		apiAccess?: boolean
		exportReports?: boolean
	}

	@Column({ type: 'boolean', default: true })
	isActive: boolean
}
