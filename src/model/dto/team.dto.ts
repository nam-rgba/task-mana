// src/dto/team.dto.ts
import { z } from 'zod'

export const CreateTeamSchema = z.object({
	key: z.string().min(2).max(50),
	name: z.string().min(2).max(150),
	description: z.string().max(255).optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional(),
	avatarUrl: z.url().optional(),
	leadId: z.number().optional(),
	settings: z
		.object({
			defaultProjectTemplate: z.string().optional(),
			workingDays: z.array(z.number().min(1).max(7)).optional(),
			timezone: z.string().optional(),
			notificationChannel: z.string().optional()
		})
		.optional()
})
export type CreateTeamDto = z.infer<typeof CreateTeamSchema>
