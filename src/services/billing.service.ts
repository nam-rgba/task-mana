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
	 * Also processes payment if IPN hasn't been called yet (e.g., localhost development)
	 */
	async handleReturn(vnpParams: Record<string, string>) {
		const isValid = verifyChecksum(vnpParams)
		const responseCode = vnpParams['vnp_ResponseCode']
		const orderCode = vnpParams['vnp_TxnRef']

		const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

		// If payment is successful and checksum valid, process the payment as fallback
		// This handles cases where IPN can't reach the server (e.g., localhost)
		if (isValid && responseCode === '00') {
			const order = await this.orderRepo.findOneByVnpTxnRef(orderCode)

			// Only process if order exists and hasn't been processed yet
			if (order && order.status === OrderStatus.PENDING) {
				const transactionNo = vnpParams['vnp_TransactionNo']
				const payDate = vnpParams['vnp_PayDate']
				const amount = Number(vnpParams['vnp_Amount']) / 100

				// Verify amount matches
				if (order.amount === amount) {
					// Update order status
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
						rawData: { ...vnpParams, source: 'return_url_fallback' }
					})
				}
			}

			return `${frontendUrl}/billing/result?status=success&orderCode=${orderCode}`
		} else {
			return `${frontendUrl}/billing/result?status=failed&orderCode=${orderCode}&code=${responseCode}`
		}
	}

	/**
	 * Get active subscription for a user
	 */
	async getSubscription(userId: number) {
		const subscription = await this.subscriptionRepo.findActiveByUserId(userId)
		if (!subscription) return null

		return {
			...subscription,
			plan: subscription.plan
				? {
						id: subscription.plan.id,
						name: subscription.plan.name,
						displayName: subscription.plan.displayName,
						monthlyPrice: subscription.plan.monthlyPrice,
						yearlyPrice: subscription.plan.yearlyPrice,
						features: subscription.plan.features
					}
				: null
		}
	}

	/**
	 * Get orders for a user
	 */
	async getOrders(userId: number, page?: number, limit?: number) {
		return await this.orderRepo.findByUserId(userId, page, limit)
	}

	/**
	 * Get all orders (admin)
	 */
	async getAllOrders(page?: number, limit?: number) {
		return await this.orderRepo.findAll(page, limit)
	}

	/**
	 * Get transaction history for a user
	 */
	async getTransactionHistory(userId: number, page?: number, limit?: number) {
		return await this.paymentHistoryRepo.findByUserId(userId, page, limit)
	}

	/**
	 * Get all transaction history (admin)
	 */
	async getAllTransactionHistory(page?: number, limit?: number) {
		return await this.paymentHistoryRepo.findAll(page, limit)
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

	// ===================== DASHBOARD ANALYTICS =====================

	/**
	 * Get dashboard overview stats
	 */
	async getDashboardOverview() {
		const [orderStats, activeSubscriptions, subscriptionsByPlan] = await Promise.all([
			this.orderRepo.getTotalStats(),
			this.subscriptionRepo.countActive(),
			this.subscriptionRepo.getActiveByPlan()
		])

		return {
			...orderStats,
			activeSubscriptions,
			subscriptionsByPlan
		}
	}

	/**
	 * Get revenue analytics by year (monthly breakdown)
	 */
	async getRevenueByYear(year: number) {
		const [monthlyRevenue, revenueByPlan, newSubscriptions] = await Promise.all([
			this.orderRepo.getRevenueStats(year),
			this.orderRepo.getRevenueByPlan(year),
			this.subscriptionRepo.getNewSubscriptionsByMonth(year)
		])

		// Fill in missing months with 0
		const allMonths = Array.from({ length: 12 }, (_, i) => i + 1)
		const monthlyRevenueMap = new Map(monthlyRevenue.map((m) => [m.month, m]))
		const subscriptionsMap = new Map(newSubscriptions.map((s) => [s.month, s]))

		const monthlyData = allMonths.map((month) => ({
			month,
			revenue: monthlyRevenueMap.get(month)?.revenue || 0,
			orderCount: monthlyRevenueMap.get(month)?.orderCount || 0,
			newSubscriptions: subscriptionsMap.get(month)?.count || 0
		}))

		// Calculate totals
		const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0)
		const totalOrders = monthlyData.reduce((sum, m) => sum + m.orderCount, 0)
		const totalNewSubscriptions = monthlyData.reduce((sum, m) => sum + m.newSubscriptions, 0)

		return {
			year,
			monthlyData,
			revenueByPlan,
			summary: {
				totalRevenue,
				totalOrders,
				totalNewSubscriptions,
				averageMonthlyRevenue: Math.round(totalRevenue / 12)
			}
		}
	}

	/**
	 * Get revenue analytics for a specific month
	 */
	async getRevenueByMonth(year: number, month: number) {
		const [revenueByPlan, recentOrders] = await Promise.all([
			this.orderRepo.getRevenueByPlan(year, month),
			this.orderRepo.getRecentOrders(20)
		])

		// Filter recent orders by the specific month
		const monthOrders = recentOrders.filter((order) => {
			if (!order.paidAt) return false
			const orderDate = new Date(order.paidAt)
			return orderDate.getFullYear() === year && orderDate.getMonth() + 1 === month
		})

		const totalRevenue = revenueByPlan.reduce((sum, p) => sum + p.revenue, 0)
		const totalOrders = revenueByPlan.reduce((sum, p) => sum + p.orderCount, 0)

		return {
			year,
			month,
			revenueByPlan,
			summary: {
				totalRevenue,
				totalOrders
			},
			recentOrders: monthOrders.slice(0, 10).map((order) => ({
				id: order.id,
				orderCode: order.orderCode,
				amount: order.amount,
				status: order.status,
				planName: order.plan?.displayName,
				userName: order.user?.name || order.user?.email,
				paidAt: order.paidAt,
				createdAt: order.createdAt
			}))
		}
	}

	/**
	 * Get recent orders for dashboard
	 */
	async getRecentOrders(limit: number = 10) {
		const orders = await this.orderRepo.getRecentOrders(limit)
		return orders.map((order) => ({
			id: order.id,
			orderCode: order.orderCode,
			amount: order.amount,
			status: order.status,
			billingCycle: order.billingCycle,
			planName: order.plan?.displayName,
			userName: order.user?.name || order.user?.email,
			userEmail: order.user?.email,
			paidAt: order.paidAt,
			createdAt: order.createdAt
		}))
	}
}

export const billingService = new BillingService()
