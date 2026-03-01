import { z } from 'zod'
import { PlanName } from '../enums/billing.enum.js'

export const CreatePlanSchema = z.object({
	name: z.nativeEnum(PlanName, { error: 'Plan name is required' }),
	displayName: z.string({ error: 'Display name is required' }).max(100),
	description: z.string().max(500).optional(),
	monthlyPrice: z.number().int().nonnegative().default(0),
	yearlyPrice: z.number().int().nonnegative().default(0),
	maxMembers: z.number().int().positive().default(5),
	maxProjects: z.number().int().positive().default(3),
	maxStorage: z.number().int().positive().default(500),
	features: z
		.object({
			aiAssistant: z.boolean().optional(),
			advancedAnalytics: z.boolean().optional(),
			prioritySupport: z.boolean().optional(),
			customBranding: z.boolean().optional(),
			apiAccess: z.boolean().optional(),
			exportReports: z.boolean().optional()
		})
		.optional(),
	isActive: z.boolean().default(true)
})

export type CreatePlanDto = z.infer<typeof CreatePlanSchema>
