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

	update = async (req: Request, res: Response, next: NextFunction) => {
		const projectId = Number(req.params.id)
		return new OKResponse(
			'Update project successfully!',
			201,
			await projectService.updateProject(projectId, req.body)
		).send(res)
	}

	deleteProject = async (req: Request, res: Response, next: NextFunction) => {
		const projectId = Number(req.params.id)
		return new OKResponse('Delete project successfully!', 204, await projectService.deleteProject(projectId)).send(res)
	}
}

const projectController = new ProjectController()

export default projectController
