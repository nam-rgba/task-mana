import dayjs from 'dayjs'
import { getOrderRepository } from '~/repository/order.repository.js'
import { getPlanRepository } from '~/repository/plan.repository.js'
import { getSubscriptionRepository } from '~/repository/subscription.repository.js'
import { getPaymentHistoryRepository } from '~/repository/payment-history.repository.js'
import { BillingCycle, OrderStatus, PaymentAction, SubscriptionStatus } from '~/model/enums/billing.enum.js'
import {
	createPaymentUrl,
	verifyChecksum,
	queryTransaction,
	refundTransaction
} from '~/services/payment/vnpay.service.js'
import { BadRequestError, NotFoundError } from '~/utils/error.reponse.js'

class BillingService {
	private orderRepo = getOrderRepository()
	private planRepo = getPlanRepository()
	private subscriptionRepo = getSubscriptionRepository()
	private paymentHistoryRepo = getPaymentHistoryRepository()

	/**
	 * Create a payment order and generate VNPAY payment URL
	 */
	async createPayment(params: { planId: number; billingCycle: BillingCycle; userId: number; ipAddr: string }) {
		const { planId, billingCycle, userId, ipAddr } = params

		// Validate plan exists
		const plan = await this.planRepo.findOneById(planId)
		if (!plan) throw new NotFoundError('Plan not found')
		if (!plan.isActive) throw new BadRequestError('This plan is not available')

		// Check if user already has the same active plan
		const activeSub = await this.subscriptionRepo.findActiveByUserId(userId)
		if (activeSub && activeSub.planId === planId && activeSub.billingCycle === billingCycle) {
			throw new BadRequestError('You already have this plan active')
		}

		// Calculate amount
		const amount = billingCycle === BillingCycle.MONTHLY ? plan.monthlyPrice : plan.yearlyPrice
		if (amount <= 0) throw new BadRequestError('Cannot create payment for a free plan')

		// Generate unique order code
		const timestamp = dayjs().format('YYYYMMDDHHmmss')
		const random = Math.random().toString(36).substring(2, 8).toUpperCase()
		const orderCode = `ORD-${timestamp}-${random}`

		// Create order
		const order = await this.orderRepo.create({
			orderCode,
			planId,
			userId,
			amount,
			billingCycle,
			status: OrderStatus.PENDING,
			vnpTxnRef: orderCode
		})

		// Log payment history
		await this.paymentHistoryRepo.create({
			orderId: order.id,
			userId,
			action: PaymentAction.CREATED,
			ipAddress: ipAddr
		})

		// Generate VNPAY payment URL
		const paymentUrl = createPaymentUrl({
			orderId: orderCode,
			amount,
			orderInfo: `Thanh toan goi ${plan.displayName}`,
			ipAddr
		})

		return {
			paymentUrl,
			orderCode,
			amount,
			planName: plan.displayName,
			billingCycle
		}
	}

	/**
	 * Handle VNPAY IPN (Instant Payment Notification) callback
	 */
	async handleIPN(vnpParams: Record<string, string>) {
		// Verify checksum
		const isValid = verifyChecksum(vnpParams)
		if (!isValid) {
			return { RspCode: '97', Message: 'Invalid checksum' }
		}

		const txnRef = vnpParams['vnp_TxnRef']
		const responseCode = vnpParams['vnp_ResponseCode']
		const transactionNo = vnpParams['vnp_TransactionNo']
		const payDate = vnpParams['vnp_PayDate']
		const amount = Number(vnpParams['vnp_Amount']) / 100 // VNPAY gửi đã nhân 100

		// Find order
		const order = await this.orderRepo.findOneByVnpTxnRef(txnRef)
		if (!order) {
			return { RspCode: '01', Message: 'Order not found' }
		}

		// Check if order already processed
		if (order.status !== OrderStatus.PENDING) {
			return { RspCode: '02', Message: 'Order already confirmed' }
		}

		// Verify amount
		if (order.amount !== amount) {
			return { RspCode: '04', Message: 'Invalid amount' }
		}

		if (responseCode === '00') {
			// Payment successful
			await this.orderRepo.update(order.id, {
				status: OrderStatus.PAID,
				vnpTransactionNo: transactionNo,
				vnpResponseCode: responseCode,
				vnpPayDate: payDate,
				paidAt: new Date()
			})

			// Deactivate current subscription
			await this.subscriptionRepo.deactivateByUserId(order.userId)

			// Create new subscription
			const startDate = new Date()
			const endDate =
				order.billingCycle === BillingCycle.MONTHLY
					? dayjs(startDate).add(1, 'month').toDate()
					: dayjs(startDate).add(1, 'year').toDate()

			await this.subscriptionRepo.create({
				userId: order.userId,
				planId: order.planId,
				billingCycle: order.billingCycle,
				startDate,
				endDate,
				status: SubscriptionStatus.ACTIVE,
				autoRenew: false
			})

			// Log payment history
			await this.paymentHistoryRepo.create({
				orderId: order.id,
				userId: order.userId,
				action: PaymentAction.PAID,
				rawData: vnpParams
			})

			return { RspCode: '00', Message: 'Confirm Success' }
		} else {
			// Payment failed
			await this.orderRepo.update(order.id, {
				status: OrderStatus.FAILED,
				vnpResponseCode: responseCode,
				vnpTransactionNo: transactionNo
			})

			await this.paymentHistoryRepo.create({
				orderId: order.id,
				userId: order.userId,
				action: PaymentAction.FAILED,
				rawData: vnpParams
			})

			return { RspCode: '00', Message: 'Confirm Success' }
		}
	}

	/**
	 * Handle VNPAY return URL (redirect user back to frontend)
	 */
	handleReturn(vnpParams: Record<string, string>) {
		const isValid = verifyChecksum(vnpParams)
		const responseCode = vnpParams['vnp_ResponseCode']
		const orderCode = vnpParams['vnp_TxnRef']

		const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

		if (isValid && responseCode === '00') {
			return `${frontendUrl}/billing/result?status=success&orderCode=${orderCode}`
		} else {
			return `${frontendUrl}/billing/result?status=failed&orderCode=${orderCode}&code=${responseCode}`
		}
	}

	/**
	 * Get active subscription for a user
	 */
	async getSubscription(userId: number) {
		return await this.subscriptionRepo.findActiveByUserId(userId)
	}

	/**
	 * Get orders for a user
	 */
	async getOrders(userId: number, page?: number, limit?: number) {
		return await this.orderRepo.findByUserId(userId, page, limit)
	}

	/**
	 * Query transaction status from VNPAY
	 */
	async queryTransactionStatus(orderCode: string, ipAddr: string) {
		const order = await this.orderRepo.findOneByOrderCode(orderCode)
		if (!order) throw new NotFoundError('Order not found')
		if (!order.vnpPayDate) throw new BadRequestError('Order has not been processed by VNPAY yet')

		const result = await queryTransaction({
			vnpTxnRef: order.orderCode,
			transDate: order.vnpPayDate,
			ipAddr
		})

		return result
	}

	/**
	 * Refund a paid order
	 */
	async refund(params: { orderCode: string; amount: number; reason: string; userId: number; ipAddr: string }) {
		const { orderCode, amount, reason, userId, ipAddr } = params

		const order = await this.orderRepo.findOneByOrderCode(orderCode)
		if (!order) throw new NotFoundError('Order not found')
		if (order.status !== OrderStatus.PAID) throw new BadRequestError('Only paid orders can be refunded')
		if (!order.vnpTransactionNo || !order.vnpPayDate) {
			throw new BadRequestError('Missing VNPAY transaction info for refund')
		}

		// Only the order owner can refund
		if (order.userId !== userId) {
			throw new BadRequestError('You can only refund your own orders')
		}

		if (amount > order.amount) {
			throw new BadRequestError('Refund amount cannot exceed order amount')
		}

		const result = await refundTransaction({
			vnpTxnRef: order.orderCode,
			transactionNo: order.vnpTransactionNo,
			amount,
			transDate: order.vnpPayDate,
			createBy: String(userId),
			ipAddr
		})

		// Update order status
		if (result.vnp_ResponseCode === '00') {
			await this.orderRepo.update(order.id, {
				status: OrderStatus.REFUNDED
			})

			// Deactivate subscription
			await this.subscriptionRepo.deactivateByUserId(userId)

			await this.paymentHistoryRepo.create({
				orderId: order.id,
				userId,
				action: PaymentAction.REFUNDED,
				rawData: { ...result, reason }
			})
		}

		return result
	}
}

export const billingService = new BillingService()
