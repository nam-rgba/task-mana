import { NextFunction, Request, Response } from 'express'
import { billingService } from '~/services/billing.service.js'
import { BillingCycle } from '~/model/enums/billing.enum.js'
import { OKResponse, CreatedResponse } from '~/utils/success.response.js'

class BillingController {
	/**
	 * POST /api/billing/create-payment
	 * Body: { planId, billingCycle }
	 */
	createPayment = async (req: Request, res: Response, next: NextFunction) => {
		const { planId, billingCycle } = req.body
		const userId = Number(req.headers['x-user-id'])
		const ipAddr = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1'

		const result = await billingService.createPayment({
			planId,
			billingCycle: billingCycle as BillingCycle,
			userId,
			ipAddr
		})

		return new CreatedResponse('Payment created successfully!', 201, result).send(res)
	}

	/**
	 * GET /api/billing/vnpay-ipn
	 * VNPAY server-to-server callback
	 */
	vnpayIPN = async (req: Request, res: Response, next: NextFunction) => {
		const vnpParams = req.query as Record<string, string>
		const result = await billingService.handleIPN(vnpParams)
		return res.status(200).json(result)
	}

	/**
	 * GET /api/billing/vnpay-return
	 * Redirect user back to frontend
	 */
	vnpayReturn = async (req: Request, res: Response, next: NextFunction) => {
		const vnpParams = req.query as Record<string, string>
		const redirectUrl = await billingService.handleReturn(vnpParams)
		return res.redirect(redirectUrl)
	}

	/**
	 * GET /api/billing/subscription
	 */
	getSubscription = async (req: Request, res: Response, next: NextFunction) => {
		const userId = Number(req.headers['x-user-id'])
		const subscription = await billingService.getSubscription(userId)
		return new OKResponse('Get subscription successfully!', 200, subscription).send(res)
	}

	/**
	 * GET /api/billing/orders
	 */
	getOrders = async (req: Request, res: Response, next: NextFunction) => {
		const userId = Number(req.headers['x-user-id'])
		const { page, limit } = req.query
		const orders = await billingService.getOrders(
			userId,
			page ? Number(page) : undefined,
			limit ? Number(limit) : undefined
		)
		return new OKResponse('Get orders successfully!', 200, orders).send(res)
	}

	/**
	 * GET /api/billing/orders/all (admin)
	 */
	getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
		const { page, limit } = req.query
		const orders = await billingService.getAllOrders(page ? Number(page) : undefined, limit ? Number(limit) : undefined)
		return new OKResponse('Get all orders successfully!', 200, orders).send(res)
	}

	/**
	 * GET /api/billing/transaction-history
	 */
	getTransactionHistory = async (req: Request, res: Response, next: NextFunction) => {
		const userId = Number(req.headers['x-user-id'])
		const { page, limit } = req.query
		const history = await billingService.getTransactionHistory(
			userId,
			page ? Number(page) : undefined,
			limit ? Number(limit) : undefined
		)
		return new OKResponse('Get transaction history successfully!', 200, history).send(res)
	}

	/**
	 * GET /api/billing/transaction-history/all (admin)
	 */
	getAllTransactionHistory = async (req: Request, res: Response, next: NextFunction) => {
		const { page, limit } = req.query
		const history = await billingService.getAllTransactionHistory(
			page ? Number(page) : undefined,
			limit ? Number(limit) : undefined
		)
		return new OKResponse('Get all transaction history successfully!', 200, history).send(res)
	}

	/**
	 * GET /api/billing/query-transaction/:orderCode
	 */
	queryTransaction = async (req: Request, res: Response, next: NextFunction) => {
		const orderCode = req.params.orderCode
		const ipAddr = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1'

		const result = await billingService.queryTransactionStatus(orderCode, ipAddr)
		return new OKResponse('Query transaction successfully!', 200, result).send(res)
	}

	/**
	 * POST /api/billing/refund
	 * Body: { orderCode, amount, reason }
	 */
	refund = async (req: Request, res: Response, next: NextFunction) => {
		const { orderCode, amount, reason } = req.body
		const userId = Number(req.headers['x-user-id'])
		const ipAddr = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1'

		const result = await billingService.refund({
			orderCode,
			amount,
			reason,
			userId,
			ipAddr
		})

		return new OKResponse('Refund processed successfully!', 200, result).send(res)
	}

	// ===================== DASHBOARD ANALYTICS =====================

	/**
	 * GET /api/billing/admin/dashboard/overview
	 */
	getDashboardOverview = async (req: Request, res: Response, next: NextFunction) => {
		const result = await billingService.getDashboardOverview()
		return new OKResponse('Get dashboard overview successfully!', 200, result).send(res)
	}

	/**
	 * GET /api/billing/admin/dashboard/revenue/:year
	 */
	getRevenueByYear = async (req: Request, res: Response, next: NextFunction) => {
		const year = Number(req.params.year) || new Date().getFullYear()
		const result = await billingService.getRevenueByYear(year)
		return new OKResponse('Get revenue by year successfully!', 200, result).send(res)
	}

	/**
	 * GET /api/billing/admin/dashboard/revenue/:year/:month
	 */
	getRevenueByMonth = async (req: Request, res: Response, next: NextFunction) => {
		const year = Number(req.params.year) || new Date().getFullYear()
		const month = Number(req.params.month) || new Date().getMonth() + 1
		const result = await billingService.getRevenueByMonth(year, month)
		return new OKResponse('Get revenue by month successfully!', 200, result).send(res)
	}

	/**
	 * GET /api/billing/admin/dashboard/recent-orders
	 */
	getRecentOrders = async (req: Request, res: Response, next: NextFunction) => {
		const limit = Number(req.query.limit) || 10
		const result = await billingService.getRecentOrders(limit)
		return new OKResponse('Get recent orders successfully!', 200, result).send(res)
	}
}

const billingController = new BillingController()

export default billingController
