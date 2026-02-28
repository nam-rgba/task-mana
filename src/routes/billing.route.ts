import { Router } from 'express'
import billingController from '~/controllers/billing.controller.js'
import AsyncHandler from '~/utils/async-handler.js'
import { authenticate } from '~/utils/auth/auth.js'
import { validate } from '~/middleware/validate.js'
import { CreatePaymentSchema, RefundSchema } from '~/model/dto/billing.dto.js'

const router = Router()

// Public endpoints (VNPAY callbacks - no auth, verified by checksum)
router.get('/vnpay-ipn', AsyncHandler(billingController.vnpayIPN))
router.get('/vnpay-return', AsyncHandler(billingController.vnpayReturn))

// Protected endpoints (require authentication)
router.post(
	'/create-payment',
	authenticate,
	validate(CreatePaymentSchema),
	AsyncHandler(billingController.createPayment)
)
router.get('/subscription', authenticate, AsyncHandler(billingController.getSubscription))
router.get('/orders', authenticate, AsyncHandler(billingController.getOrders))
router.get('/query-transaction/:orderCode', authenticate, AsyncHandler(billingController.queryTransaction))
router.post('/refund', authenticate, validate(RefundSchema), AsyncHandler(billingController.refund))

export { router as billingRouter }
