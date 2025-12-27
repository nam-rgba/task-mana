import { NextFunction, Request, Response } from 'express'
import { projectService } from '~/services/project.service.js'
import { OKResponse, SuccessResponse } from '~/utils/success.response.js'

class ProjectController {
	getAll = async (req: Request, res: Response, next: NextFunction) => {
		return new OKResponse('Get projects successfully!', 200, await projectService.getProjects(req.query)).send(res)
	}

	create = async (req: Request, res: Response, next: NextFunction) => {
		return new OKResponse('Create project successfully!', 201, await projectService.createProject(req.body)).send(res)
	}
}

const projectController = new ProjectController()

export default projectController
