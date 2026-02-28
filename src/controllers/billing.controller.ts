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
		const userId = Number(req.headers['x-client-id'])
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
		const redirectUrl = billingService.handleReturn(vnpParams)
		return res.redirect(redirectUrl)
	}

	/**
	 * GET /api/billing/subscription
	 */
	getSubscription = async (req: Request, res: Response, next: NextFunction) => {
		const userId = Number(req.headers['x-client-id'])
		const subscription = await billingService.getSubscription(userId)
		return new OKResponse('Get subscription successfully!', 200, subscription).send(res)
	}

	/**
	 * GET /api/billing/orders
	 */
	getOrders = async (req: Request, res: Response, next: NextFunction) => {
		const userId = Number(req.headers['x-client-id'])
		const { page, limit } = req.query
		const orders = await billingService.getOrders(
			userId,
			page ? Number(page) : undefined,
			limit ? Number(limit) : undefined
		)
		return new OKResponse('Get orders successfully!', 200, orders).send(res)
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
		const userId = Number(req.headers['x-client-id'])
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
}

const billingController = new BillingController()

export default billingController
