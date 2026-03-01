import { Router } from 'express'
import billingController from '~/controllers/billing.controller.js'
import AsyncHandler from '~/utils/async-handler.js'
import { validate } from '~/middleware/validate.js'
import { CreatePaymentSchema, RefundSchema } from '~/model/dto/billing.dto.js'

const router = Router()

// Public endpoints (VNPAY callbacks - no auth, verified by checksum)
router.get('/vnpay-ipn', AsyncHandler(billingController.vnpayIPN))
router.get('/vnpay-return', AsyncHandler(billingController.vnpayReturn))

// Protected endpoints (require authentication)
router.post('/create-payment', validate(CreatePaymentSchema), AsyncHandler(billingController.createPayment))
router.get('/subscription', AsyncHandler(billingController.getSubscription))
router.get('/orders', AsyncHandler(billingController.getOrders))
router.get('/transaction-history', AsyncHandler(billingController.getTransactionHistory))
router.get('/query-transaction/:orderCode', AsyncHandler(billingController.queryTransaction))
router.post('/refund', validate(RefundSchema), AsyncHandler(billingController.refund))

// Admin endpoints
router.get('/admin/orders', AsyncHandler(billingController.getAllOrders))
router.get('/admin/transaction-history', AsyncHandler(billingController.getAllTransactionHistory))

// Admin Dashboard Analytics
router.get('/admin/dashboard/overview', AsyncHandler(billingController.getDashboardOverview))
router.get('/admin/dashboard/revenue/:year', AsyncHandler(billingController.getRevenueByYear))
router.get('/admin/dashboard/revenue/:year/:month', AsyncHandler(billingController.getRevenueByMonth))
router.get('/admin/dashboard/recent-orders', AsyncHandler(billingController.getRecentOrders))

export { router as billingRouter }
