// src/controller/task.controller.ts
import { NextFunction, Request, Response } from 'express'
import { aiGenService } from '~/services/ai/ai-gen.service.js'

import { TaskService } from '~/services/task.service.js'
import { CreatedResponse, SuccessResponse } from '~/utils/success.response.js'

const taskService = new TaskService()

class TaskController {
	create = async (req: Request, res: Response, next: NextFunction) => {
		new CreatedResponse('Create task successfully!', 201, await taskService.createTask(req.body)).send(res)
	}

	update = async (req: Request, res: Response, next: NextFunction) => {
		const id = Number(req.params.id)
		new SuccessResponse({
			message: 'Update task successfully!',
			statusCode: 201,
			metadata: await taskService.updateTask(id, req.body)
		}).send(res)
	}

	get = async (req: Request, res: Response, next: NextFunction) => {
		new SuccessResponse({
			message: 'Get tasks successfully!',
			statusCode: 200,
			metadata: await taskService.getTasks(req.query as any)
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

	genAiTask = async (req: Request, res: Response, next: NextFunction) => {
		new SuccessResponse({
			message: 'AI generated task successfully!',
			statusCode: 200,
			metadata: await aiGenService.generateTask(req.body)
		}).send(res)
	}

	// Gửi request QC
	submitForQC = async (req: Request, res: Response, next: NextFunction) => {
		const id = Number(req.params.id)
		new SuccessResponse({
			message: 'Task submitted for QC review successfully!',
			statusCode: 200,
			metadata: await taskService.submitForQC(id)
		}).send(res)
	}

	// QC đánh giá task
	submitQCReview = async (req: Request, res: Response, next: NextFunction) => {
		const id = Number(req.params.id)
		new SuccessResponse({
			message: 'QC review submitted successfully!',
			statusCode: 200,
			metadata: await taskService.submitQCReview(id, req.body)
		}).send(res)
	}
}

const taskController = new TaskController()

export default taskController
