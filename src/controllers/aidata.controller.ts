import { aiDataService } from '~/services/ai/ai-data.service.js'
import { OKResponse } from '~/utils/success.response.js'
import { NextFunction, Request, Response } from 'express'

class AiDataController {
	static async getAllTask(req: Request, res: Response) {
		return new OKResponse('Get all tasks successfully!', 200, await aiDataService.getAllTask({ ...req.query })).send(
			res
		)
	}

	static async getAllProject(req: Request, res: Response) {
		return new OKResponse(
			'Get all projects successfully!',
			200,
			await aiDataService.getAllProject({ ...req.query })
		).send(res)
	}

	static async getAllMembers(req: Request, res: Response) {
		return new OKResponse(
			'Get all members successfully!',
			200,
			await aiDataService.getAllTeamMember({ ...req.query })
		).send(res)
	}

	static async getAllUsers(req: Request, res: Response) {
		return new OKResponse('Get all users successfully!', 200, await aiDataService.getAllUser({ ...req.query })).send(
			res
		)
	}
}

export default AiDataController
