import { NextFunction, Request, Response } from 'express'
import { projectService } from '~/services/project.service.js'
import { OKResponse, SuccessResponse } from '~/utils/success.response.js'

class ProjectController {
	getAll = async (req: Request, res: Response, next: NextFunction) => {
		return new OKResponse('Get projects successfully!', 200, await projectService.getProjects(req.query)).send(res)
	}
}

const projectController = new ProjectController()

export default projectController
