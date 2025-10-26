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
	id: string
	title: string
	description?: string
	status: TaskStatus
	dueDate?: Date
	estimateEffort: number
	actualEffort: number
	implementorId?: number
	reviewerId?: number
	projectId?: number
	parentTaskId?: string
	priority?: TaskPriority
	completedPercent?: number
	completedAt?: Date
	fileUrls?: string[]
	createdAt: Date
	updatedAt: Date
}
