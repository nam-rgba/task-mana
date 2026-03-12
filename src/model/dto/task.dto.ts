import { z } from 'zod'

export const ReviewPerformanceSchema = z
	.object({
		userId: z.coerce.number().int().positive(),
		teamId: z.coerce.number().int().positive(),
		fromAt: z.coerce.number().int().positive(),
		toAt: z.coerce.number().int().positive()
	})
	.superRefine(({ fromAt, toAt }, ctx) => {
		if (fromAt > toAt) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'fromAt must be less than or equal to toAt',
				path: ['fromAt']
			})
		}
	})

export const TeamPerformanceDashboardSchema = z
	.object({
		teamId: z.coerce.number().int().positive(),
		fromAt: z.coerce.number().int().positive(),
		toAt: z.coerce.number().int().positive()
	})
	.superRefine(({ fromAt, toAt }, ctx) => {
		if (fromAt > toAt) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'fromAt must be less than or equal to toAt',
				path: ['fromAt']
			})
		}
	})
