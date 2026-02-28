import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm'
import { AppBaseEntity } from './base.entity.js'
import { Plan } from './plan.entity.js'
import { User } from './user.entity.js'
import { BillingCycle, OrderStatus } from './enums/billing.enum.js'

@Entity('orders')
export class Order extends AppBaseEntity {
	@Index({ unique: true })
	@Column({ type: 'varchar', length: 50 })
	orderCode: string

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

	@Column({ type: 'int' })
	amount: number // VNĐ

	@Column({ type: 'enum', enum: BillingCycle })
	billingCycle: BillingCycle

	@Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
	status: OrderStatus

	// VNPAY fields
	@Column({ type: 'varchar', length: 100, nullable: true })
	vnpTxnRef?: string

	@Column({ type: 'varchar', length: 100, nullable: true })
	vnpTransactionNo?: string

	@Column({ type: 'varchar', length: 10, nullable: true })
	vnpResponseCode?: string

	@Column({ type: 'varchar', length: 50, nullable: true })
	vnpPayDate?: string

	@Column({ type: 'timestamptz', nullable: true })
	paidAt?: Date
}
