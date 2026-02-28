export enum PlanName {
	FREE = 'FREE',
	PRO = 'PRO',
	ENTERPRISE = 'ENTERPRISE'
}

export enum BillingCycle {
	MONTHLY = 'MONTHLY',
	YEARLY = 'YEARLY'
}

export enum OrderStatus {
	PENDING = 'PENDING',
	PAID = 'PAID',
	FAILED = 'FAILED',
	CANCELLED = 'CANCELLED',
	REFUNDED = 'REFUNDED'
}

export enum SubscriptionStatus {
	ACTIVE = 'ACTIVE',
	EXPIRED = 'EXPIRED',
	CANCELLED = 'CANCELLED'
}

export enum PaymentAction {
	CREATED = 'CREATED',
	PAID = 'PAID',
	FAILED = 'FAILED',
	REFUNDED = 'REFUNDED'
}
