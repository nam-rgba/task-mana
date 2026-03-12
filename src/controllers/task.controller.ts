// src/controller/task.controller.ts
import { NextFunction, Request, Response } from 'express'
import { aiGenService } from '~/services/ai/ai-gen.service.js'

import { TaskService } from '~/services/task.service.js'
import { CreatedResponse, SuccessResponse } from '~/utils/success.response.js'

const taskService = new TaskService()

class TaskController {
	create = async (req: Request, res: Response, next: NextFunction) => {
		const actorUserId = Number(req.headers['x-user-id']) || undefined
		new CreatedResponse('Create task successfully!', 201, await taskService.createTask(req.body, actorUserId)).send(res)
	}

	update = async (req: Request, res: Response, next: NextFunction) => {
		const id = Number(req.params.id)
		const actorUserId = Number(req.headers['x-user-id']) || undefined
		new SuccessResponse({
			message: 'Update task successfully!',
			statusCode: 201,
			metadata: await taskService.updateTask(id, req.body, actorUserId)
		}).send(res)
	}

	get = async (req: Request, res: Response, next: NextFunction) => {
		new SuccessResponse({
			message: 'Get tasks successfully!',
			statusCode: 200,
			metadata: await taskService.getTasks(req.query as any)
		}).send(res)
	}

	getOne = async (req: Request, res: Response, next: NextFunction) => {
		const id = Number(req.params.id)
		new SuccessResponse({
			message: 'Get task successfully!',
			statusCode: 200,
			metadata: await taskService.getTaskById(id)
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
		const userId = Number(req.headers['x-user-id']) || undefined
		new SuccessResponse({
			message: 'AI generated task successfully!',
			statusCode: 200,
			metadata: await aiGenService.generateTask(req.body, {
				userId,
				requestType: 'chat',
				metadata: {
					projectId: req.body?.project_id || req.body?.projectId || null,
					teamId: req.body?.team_id || req.body?.teamId || null
				}
			})
		}).send(res)
	}

	suggestDev = async (req: Request, res: Response, next: NextFunction) => {
		const userId = Number(req.headers['x-user-id']) || undefined
		new SuccessResponse({
			message: 'AI suggested developer successfully!',
			statusCode: 200,
			metadata: await aiGenService.suggestDeveloper(req.body, {
				userId,
				requestType: 'chat',
				metadata: {
					projectId: req.body?.project_id || req.body?.projectId || null,
					teamId: req.body?.team_id || req.body?.teamId || null
				}
			})
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

	// Gợi ý task cho hôm nay
	suggestTaskToday = async (req: Request, res: Response, next: NextFunction) => {
		const userId = Number(req.headers['x-user-id']) || undefined
		new SuccessResponse({
			message: 'AI suggested tasks for today successfully!',
			statusCode: 200,
			metadata: await aiGenService.suggestTaskToday(req.query, {
				userId,
				requestType: 'chat',
				metadata: {
					projectId: req.query?.project_id || req.query?.projectId || null,
					teamId: req.query?.team_id || req.query?.teamId || null
				}
			})
		}).send(res)
	}

	// gợi ý story point cho task
	estimateSP = async (req: Request, res: Response, next: NextFunction) => {
		const userId = Number(req.headers['x-user-id']) || undefined
		new SuccessResponse({
			message: 'AI estimated story point successfully!',
			statusCode: 201,
			metadata: await aiGenService.estimateEffort(req.body, {
				userId,
				requestType: 'chat',
				metadata: {
					projectId: req.body?.project_id || req.body?.projectId || null,
					teamId: req.body?.team_id || req.body?.teamId || null
				}
			})
		}).send(res)
	}

	//check task trùng lặp, na ná
	checkDuplicateTask = async (req: Request, res: Response, next: NextFunction) => {
		const userId = Number(req.headers['x-user-id']) || undefined
		new SuccessResponse({
			message: 'AI checked duplicate task successfully!',
			statusCode: 200,
			metadata: await aiGenService.checkDuplicateTask(req.body, {
				userId,
				requestType: 'chat',
				metadata: {
					projectId: req.body?.project_id || req.body?.projectId || null,
					teamId: req.body?.team_id || req.body?.teamId || null
				}
			})
		}).send(res)
	}
}

const taskController = new TaskController()

export default taskController
