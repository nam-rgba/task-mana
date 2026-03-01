import { z } from 'zod'

export const CreatePaymentSchema = z.object({
	planId: z.number({ error: 'planId is required' }).int().positive(),
	billingCycle: z.enum(['MONTHLY', 'YEARLY'] as const, {
		error: 'billingCycle must be MONTHLY or YEARLY'
	})
})

export type CreatePaymentDto = z.infer<typeof CreatePaymentSchema>

export const RefundSchema = z.object({
	orderCode: z.string({ error: 'orderCode is required' }).min(1),
	amount: z.number({ error: 'amount is required' }).int().positive(),
	reason: z.string({ error: 'reason is required' }).min(1).max(500)
})

export type RefundDto = z.infer<typeof RefundSchema>
