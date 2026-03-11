import { Request, Response, NextFunction } from 'express'
import { scheduleService } from '~/services/schedule.service.js'
import { CreatedResponse, OKResponse } from '~/utils/success.response.js'

class ScheduleController {
	getAll = async (req: Request, res: Response, next: NextFunction) => {
		const projectId = Number(req.params.projectId)
		new OKResponse('Get schedules successfully!', 200, await scheduleService.getByProject(projectId)).send(res)
	}

	getOne = async (req: Request, res: Response, next: NextFunction) => {
		const projectId = Number(req.params.projectId)
		const id = Number(req.params.id)
		new OKResponse('Get schedule successfully!', 200, await scheduleService.getOne(projectId, id)).send(res)
	}

	create = async (req: Request, res: Response, next: NextFunction) => {
		const projectId = Number(req.params.projectId)
		new CreatedResponse('Create schedule successfully!', 201, await scheduleService.create(projectId, req.body)).send(res)
	}

	update = async (req: Request, res: Response, next: NextFunction) => {
		const projectId = Number(req.params.projectId)
		const id = Number(req.params.id)
		new OKResponse('Update schedule successfully!', 200, await scheduleService.update(projectId, id, req.body)).send(res)
	}

	delete = async (req: Request, res: Response, next: NextFunction) => {
		const projectId = Number(req.params.projectId)
		const id = Number(req.params.id)
		new OKResponse('Delete schedule successfully!', 200, await scheduleService.delete(projectId, id)).send(res)
	}

	reorder = async (req: Request, res: Response, next: NextFunction) => {
		const projectId = Number(req.params.projectId)
		await scheduleService.reorder(projectId, req.body.orders)
		new OKResponse('Reorder schedules successfully!', 200, null).send(res)
	}

	bulkAssignTasks = async (req: Request, res: Response, next: NextFunction) => {
		const projectId = Number(req.params.projectId)
		const scheduleId = Number(req.params.id)
		const result = await scheduleService.bulkAssignTasks(projectId, scheduleId, req.body.taskIds)
		new OKResponse('Tasks assigned to schedule successfully!', 200, { assignedCount: result.length, tasks: result }).send(res)
	}

	reorderTasks = async (req: Request, res: Response, next: NextFunction) => {
		const projectId = Number(req.params.projectId)
		const scheduleId = Number(req.params.id)
		await scheduleService.reorderTasks(projectId, scheduleId, req.body.orders)
		new OKResponse('Reorder tasks successfully!', 200, null).send(res)
	}
}

export const scheduleController = new ScheduleController()
