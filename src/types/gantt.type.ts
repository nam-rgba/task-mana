import { TaskStatus, TaskType, TaskPriority } from './task.type.js'
import { ScheduleStatus, DependencyType, MilestoneStatus } from '~/model/enums/gantt.enum.js'
import { ProjectStatus } from '~/model/enums/project.enum.js'

// ─── Schedule ───

export interface ScheduleDto {
	id: number
	name: string
	description?: string
	startDate: number
	endDate: number
	status: ScheduleStatus
	color: string
	projectId: number
	sortOrder: number
	progress: number
	taskCount: number
	completedTaskCount: number
}

// ─── Gantt Task ───

export interface GanttTaskDto {
	id: number
	title: string
	startDate: number | null
	dueDate: number | null
	duration: number | null
	status: TaskStatus
	type: TaskType
	priority: TaskPriority | null
	completedPercent: number
	sortOrder: number
	scheduleId: number | null
	projectId: number
	assignee: { id: number; name: string; avatarUrl?: string } | null
	reviewer: { id: number; name: string } | null
	predecessors: DependencyLink[]
	successors: DependencyLink[]
}

export interface DependencyLink {
	dependencyId: number
	taskId: number
	type: DependencyType
	lagDays: number
}

// ─── Milestone ───

export interface MilestoneDto {
	id: number
	name: string
	description?: string
	dueDate: number
	status: MilestoneStatus
	color: string
	projectId: number
	scheduleId: number | null
	sortOrder: number
}

// ─── Dependency ───

export interface TaskDependencyDto {
	id: number
	predecessorId: number
	successorId: number
	type: DependencyType
	lagDays: number
}

// ─── Gantt Response ───

export interface GanttScheduleGroup {
	schedule: ScheduleDto
	tasks: GanttTaskDto[]
}

export interface GanttResponse {
	project: {
		id: number
		name: string
		startDate: string | null
		endDate: string | null
		status: ProjectStatus
	}
	schedules: GanttScheduleGroup[]
	unscheduledTasks: GanttTaskDto[]
	milestones: MilestoneDto[]
	dependencies: TaskDependencyDto[]
	summary: {
		totalTasks: number
		completedTasks: number
		overallProgress: number
		criticalPath: number[]
		dateRange: {
			earliest: number
			latest: number
		}
	}
}

// ─── Request DTOs ───

export interface GanttFilters {
	startDate?: number
	endDate?: number
	assigneeId?: number
	status?: string
	scheduleId?: number
}

export interface TaskScheduleUpdate {
	taskId: number
	startDate: number
	dueDate: number
}

export interface ScheduleDateUpdate {
	scheduleId: number
	startDate: number
	endDate: number
}
