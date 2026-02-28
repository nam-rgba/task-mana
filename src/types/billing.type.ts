import { BillingCycle, OrderStatus, SubscriptionStatus } from '~/model/enums/billing.enum.js'

export interface CreatePaymentRequest {
	planId: number
	billingCycle: BillingCycle
}

export interface VnpayParams {
	vnp_TmnCode: string
	vnp_Amount: string
	vnp_BankCode?: string
	vnp_BankTranNo?: string
	vnp_CardType?: string
	vnp_PayDate: string
	vnp_OrderInfo: string
	vnp_TransactionNo: string
	vnp_ResponseCode: string
	vnp_TransactionStatus: string
	vnp_TxnRef: string
	vnp_SecureHashType?: string
	vnp_SecureHash: string
	[key: string]: string | undefined
}

export interface VnpayConfig {
	vnpTmnCode: string
	vnpHashSecret: string
	vnpUrl: string
	vnpReturnUrl: string
	vnpIpnUrl: string
}

export interface RefundRequest {
	orderCode: string
	amount: number
	reason: string
}

export interface SubscriptionInfo {
	id: number
	userId: number
	planId: number
	planName: string
	billingCycle: BillingCycle
	startDate: Date
	endDate: Date
	status: SubscriptionStatus
	autoRenew: boolean
}

export interface OrderInfo {
	id: number
	orderCode: string
	amount: number
	billingCycle: BillingCycle
	status: OrderStatus
	createdAt: Date
	paidAt?: Date
}
