import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { AppBaseEntity } from './base.entity.js'
import { Order } from './order.entity.js'
import { PaymentAction } from './enums/billing.enum.js'

@Entity('payment_histories')
export class PaymentHistory extends AppBaseEntity {
	@ManyToOne(() => Order, { nullable: false })
	@JoinColumn({ name: 'orderId' })
	order: Awaited<Order>

	@Column({ type: 'int' })
	orderId: number

	@Column({ type: 'int' })
	userId: number

	@Column({ type: 'enum', enum: PaymentAction })
	action: PaymentAction

	@Column({ type: 'jsonb', nullable: true })
	rawData?: Record<string, any>

	@Column({ type: 'varchar', length: 50, nullable: true })
	ipAddress?: string
}
