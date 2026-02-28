import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { AppBaseEntity } from './base.entity.js'
import { User } from './user.entity.js'
import { Plan } from './plan.entity.js'
import { BillingCycle, SubscriptionStatus } from './enums/billing.enum.js'

@Entity('subscriptions')
export class Subscription extends AppBaseEntity {
	@ManyToOne(() => User, { nullable: false })
	@JoinColumn({ name: 'userId' })
	user: Awaited<User>

	@Column({ type: 'int' })
	userId: number

	@ManyToOne(() => Plan, { nullable: false })
	@JoinColumn({ name: 'planId' })
	plan: Awaited<Plan>

	@Column({ type: 'int' })
	planId: number

	@Column({ type: 'enum', enum: BillingCycle })
	billingCycle: BillingCycle

	@Column({ type: 'timestamptz' })
	startDate: Date

	@Column({ type: 'timestamptz' })
	endDate: Date

	@Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
	status: SubscriptionStatus

	@Column({ type: 'boolean', default: false })
	autoRenew: boolean
}
