import { z } from 'zod'
import { ScheduleStatus, DependencyType, MilestoneStatus } from '../enums/gantt.enum.js'

// ─── Schedule DTOs ───

export const CreateScheduleSchema = z.object({
	name: z.string().min(1).max(200),
	description: z.string().optional(),
	startDate: z.number().int(),
	endDate: z.number().int(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.default('#6366f1')
})

export type CreateScheduleDto = z.infer<typeof CreateScheduleSchema>

export const UpdateScheduleSchema = z.object({
	name: z.string().min(1).max(200).optional(),
	description: z.string().optional(),
	startDate: z.number().int().optional(),
	endDate: z.number().int().optional(),
	status: z.nativeEnum(ScheduleStatus).optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional()
})

export type UpdateScheduleDto = z.infer<typeof UpdateScheduleSchema>

export const ReorderScheduleSchema = z.object({
	orders: z.array(
		z.object({
			id: z.number().int(),
			sortOrder: z.number().int()
		})
	)
})

export type ReorderScheduleDto = z.infer<typeof ReorderScheduleSchema>

export const BulkAssignTasksSchema = z.object({
	taskIds: z.array(z.number().int()).min(1)
})

export type BulkAssignTasksDto = z.infer<typeof BulkAssignTasksSchema>

// ─── Dependency DTOs ───

export const CreateDependencySchema = z.object({
	predecessorId: z.number().int(),
	type: z.nativeEnum(DependencyType).default(DependencyType.FS),
	lagDays: z.number().int().min(-365).max(365).default(0)
})

export type CreateDependencyDto = z.infer<typeof CreateDependencySchema>

// ─── Milestone DTOs ───

export const CreateMilestoneSchema = z.object({
	name: z.string().min(1).max(200),
	description: z.string().optional(),
	dueDate: z.number().int(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.default('#f59e0b'),
	scheduleId: z.number().int().optional()
})

export type CreateMilestoneDto = z.infer<typeof CreateMilestoneSchema>

export const UpdateMilestoneSchema = z.object({
	name: z.string().min(1).max(200).optional(),
	description: z.string().optional(),
	dueDate: z.number().int().optional(),
	status: z.nativeEnum(MilestoneStatus).optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional(),
	scheduleId: z.number().int().nullable().optional()
})

export type UpdateMilestoneDto = z.infer<typeof UpdateMilestoneSchema>

// ─── Gantt Schedule Update DTOs ───

export const GanttScheduleUpdateSchema = z.object({
	taskUpdates: z
		.array(
			z.object({
				taskId: z.number().int(),
				startDate: z.number().int(),
				dueDate: z.number().int()
			})
		)
		.optional()
		.default([]),
	scheduleUpdates: z
		.array(
			z.object({
				scheduleId: z.number().int(),
				startDate: z.number().int(),
				endDate: z.number().int()
			})
		)
		.optional()
		.default([]),
	autoSchedule: z.boolean().default(true)
})

export type GanttScheduleUpdateDto = z.infer<typeof GanttScheduleUpdateSchema>
