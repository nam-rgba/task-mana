export enum TaskStatus {
	Pending = 'PENDING',
	Processing = 'PROCESSING',
	WaitReview = 'WAIT_REVIEW',
	Done = 'DONE'
}

export enum TaskPriority {
	Low = 'LOW',
	Medium = 'MEDIUM',
	High = 'HIGH',
	Urgent = 'URGENT'
}

export interface Task {
	id: number
	title: string
	description?: string
	status: TaskStatus
	dueDate?: number
	estimateEffort: number
	actualEffort: number
	assignee?: number
	reviewerId?: number
	projectId?: number
	parentTaskId?: string
	priority?: TaskPriority
	completedPercent?: number
	completedAt?: number
	fileUrls?: string[]
	createdAt: Date
	updatedAt: Date
}
