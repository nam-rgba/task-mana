// src/controller/task.controller.ts
import { Request, Response } from 'express'
import { TaskService } from '~/services/task.service.js'

const taskService = new TaskService()

export class TaskController {
	async getTasks(req: Request, res: Response) {
		try {
			const { page, limit, skip, sort, q, title, completed } = req.query
			const query: any = {}
			if (q) query.q = String(q)
			if (title) query.title = String(title)
			if (completed !== undefined) query.completed = completed === 'true'

			const result = await taskService.getTasks({
				page: page ? Number(page) : undefined,
				limit: limit ? Number(limit) : undefined,
				skip: skip ? Number(skip) : undefined,
				query,
				sort: sort ? String(sort) : undefined
			})
			return res.json(result)
		} catch (err) {
			console.error('Error in getTasks:', err)
			return res.status(500).json({ message: 'Internal server error' })
		}
	}

	async getTask(req: Request, res: Response) {
		try {
			const { id } = req.params
			const task = await taskService.getTaskById(id)
			if (!task) {
				return res.status(404).json({ message: 'Task not found' })
			}
			return res.json(task)
		} catch (err) {
			console.error('Error in getTask:', err)
			return res.status(500).json({ message: 'Internal server error' })
		}
	}

	async createTask(req: Request, res: Response) {
		try {
			const data = req.body
			const task = await taskService.createTask(data)
			return res.status(201).json(task)
		} catch (err) {
			console.error('Error in createTask:', err)
			return res.status(500).json({ message: 'Internal server error' })
		}
	}

	async updateTask(req: Request, res: Response) {
		try {
			const { id } = req.params
			const data = req.body
			const updated = await taskService.updateTask(id, data)
			if (!updated) {
				return res.status(404).json({ message: 'Task not found' })
			}
			return res.json(updated)
		} catch (err) {
			console.error('Error in updateTask:', err)
			return res.status(500).json({ message: 'Internal server error' })
		}
	}

	async deleteTask(req: Request, res: Response) {
		try {
			const { id } = req.params
			const success = await taskService.deleteTask(id)
			if (!success) {
				return res.status(404).json({ message: 'Task not found or could not delete' })
			}
			return res.status(204).send()
		} catch (err) {
			console.error('Error in deleteTask:', err)
			return res.status(500).json({ message: 'Internal server error' })
		}
	}
}
