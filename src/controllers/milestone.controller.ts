import { Request, Response, NextFunction } from 'express'
import { milestoneService } from '~/services/milestone.service.js'
import { CreatedResponse, OKResponse } from '~/utils/success.response.js'

class MilestoneController {
	getAll = async (req: Request, res: Response, next: NextFunction) => {
		const projectId = Number(req.params.projectId)
		new OKResponse('Get milestones successfully!', 200, await milestoneService.getByProject(projectId)).send(res)
	}

	create = async (req: Request, res: Response, next: NextFunction) => {
		const projectId = Number(req.params.projectId)
		new CreatedResponse('Create milestone successfully!', 201, await milestoneService.create(projectId, req.body)).send(res)
	}

	update = async (req: Request, res: Response, next: NextFunction) => {
		const projectId = Number(req.params.projectId)
		const id = Number(req.params.id)
		new OKResponse('Update milestone successfully!', 200, await milestoneService.update(projectId, id, req.body)).send(res)
	}

	delete = async (req: Request, res: Response, next: NextFunction) => {
		const projectId = Number(req.params.projectId)
		const id = Number(req.params.id)
		new OKResponse('Delete milestone successfully!', 200, await milestoneService.delete(projectId, id)).send(res)
	}
}

export const milestoneController = new MilestoneController()
