// src/service/task.service.ts
import { getTaskRepository } from '~/repository/task.repository.js'
import { Task } from '~/model/Task.js'

export class TaskService {
	private repo = getTaskRepository()

	async getTasks(query: { page?: number; limit?: number; [key: string]: any }) {
		const { page, limit, ...queries } = query
		console.log('TaskService.getTasks called with query:', queries)
		return await this.repo.findAll({
			page,
			limit,
			query: queries
		})
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
}
