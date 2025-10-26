// src/service/task.service.ts
import { getTaskRepository } from '~/repository/task.repository.js'
import { Task } from '~/model/Task.js'

export class TaskService {
	private repo = getTaskRepository()

	async getTasks(params: { page?: number; limit?: number; skip?: number; query?: any; sort?: string }) {
		return this.repo.findAll(params)
	}

	async getTaskById(id: string): Promise<Task | null> {
		return this.repo.findOne(id)
	}

	async createTask(data: Partial<Task>): Promise<Task> {
		return this.repo.create(data)
	}

	async updateTask(id: string, data: Partial<Task>): Promise<Task | null> {
		return this.repo.update(id, data)
	}

	async deleteTask(id: string): Promise<boolean> {
		return this.repo.remove(id)
	}
}
