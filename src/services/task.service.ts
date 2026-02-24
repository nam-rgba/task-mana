// src/service/task.service.ts
import { getTaskRepository, TaskQuery } from '~/repository/task.repository.js'
import { Task } from '~/model/task.entity.js'
import { TaskStatus, QCReviewStatus } from '~/types/task.type.js'

export class TaskService {
	private repo = getTaskRepository()

	async getTasks(query: TaskQuery) {
		const { page, limit, ...queries } = query
		return await this.repo.findAllByRawQuery(query)
	}

	async getTaskById(id: number): Promise<Task | null> {
		return this.repo.findOne(id)
	}

	async createTask(data: Partial<Task>): Promise<Task> {
		return this.repo.create(data)
	}

	async updateTask(id: number, data: Partial<Task>): Promise<Task | null> {
		return this.repo.update(id, data)
	}

	async deleteTask(id: number): Promise<boolean> {
		return this.repo.remove(id)
	}

	// Gửi request QC - chuyển từ PROCESSING sang WAIT_REVIEW
	async submitForQC(id: number): Promise<Task | null> {
		const task = await this.repo.findOne(id)
		if (!task) {
			throw new Error('Task not found')
		}
		if (task.status !== TaskStatus.Processing) {
			throw new Error('Task must be in PROCESSING status to submit for QC')
		}
		return this.repo.update(id, { status: TaskStatus.WaitReview })
	}

	// QC đánh giá task
	async submitQCReview(
		id: number,
		data: {
			passed: boolean
			score: number
			actualEffort: number
		}
	): Promise<Task | null> {
		const task = await this.repo.findOne(id)
		if (!task) {
			throw new Error('Task not found')
		}
		if (task.status !== TaskStatus.WaitReview) {
			throw new Error('Task must be in WAIT_REVIEW status to submit QC review')
		}

		const newStatus = data.passed ? TaskStatus.Done : TaskStatus.Processing
		const completedAt = data.passed ? Math.floor(Date.now() / 1000) : task.completedAt

		return this.repo.update(id, {
			qcReviewStatus: data.passed ? QCReviewStatus.Pass : QCReviewStatus.Fail,
			score: data.score,
			actualEffort: data.actualEffort,
			status: newStatus,
			completedAt
		})
	}
}

export const taskService = new TaskService()
