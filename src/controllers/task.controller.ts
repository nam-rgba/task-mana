// src/controller/task.controller.ts
import { NextFunction, Request, Response } from 'express'

import { TaskService } from '~/services/task.service.js'
import { CreatedResponse, SuccessResponse } from '~/utils/success.response.js'

const taskService = new TaskService()

class TaskController {
	create = async (req: Request, res: Response, next: NextFunction) => {
		new CreatedResponse('Create task successfully!', 201, await taskService.createTask(req.body)).send(res)
	}

	get = async (req: Request, res: Response, next: NextFunction) => {
		new SuccessResponse({
			message: 'Get tasks successfully!',
			statusCode: 200,
			metadata: await taskService.getTasks(req.query)
		}).send(res)
	}

	dlt = async (req: Request, res: Response, next: NextFunction) => {
		const id = Number(req.params.id)
		await taskService.deleteTask(id)
		new SuccessResponse({
			message: 'Delete task successfully!',
			statusCode: 202,
			metadata: null
		}).send(res)
	}
}

const taskController = new TaskController()

export default taskController
