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
			metadata: await taskService.getTasks(req.params)
		}).send(res)
	}
}

const taskController = new TaskController()

export default taskController
