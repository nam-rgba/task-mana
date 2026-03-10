import { NextFunction, Request, Response } from 'express'
import path from 'path'
import { aiGenService } from '~/services/ai/ai-gen.service.js'
import { projectService } from '~/services/project.service.js'
import { teamService } from '~/services/team.service.js'
import { CloudinaryService } from '~/services/upload/cloudinary.service.js'
import { BadRequestError } from '~/utils/error.reponse.js'
import { OKResponse, SuccessResponse } from '~/utils/success.response.js'

class ProjectController {
	getAll = async (req: Request, res: Response, next: NextFunction) => {
		return new OKResponse('Get projects successfully!', 200, await projectService.getProjects(req.query)).send(res)
	}

	getOne = async (req: Request, res: Response, next: NextFunction) => {
		const projectId = Number(req.params.id)
		return new OKResponse('Get project successfully!', 200, await projectService.getProjectById(projectId)).send(res)
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

	genProjectSchedule = async (req: Request, res: Response, next: NextFunction) => {
		const teamId = Number(req.params.teamId)
		const projectId = Number(req.params.projectId)
		const file = req.file

		if (!file) {
			throw new BadRequestError('PDF file is required')
		}

		if (file.mimetype !== 'application/pdf') {
			throw new BadRequestError('Only PDF files are allowed')
		}

		// Upload file lên Cloudinary
		const absolutePath = path.resolve(file.path)
		const uploadResult = await CloudinaryService.uploadImageFromLocal({
			filePath: absolutePath,
			folder: 'use-cases'
		})

		// Lưu useCaseUrl vào project
		await projectService.updateProject(projectId, { useCaseUrl: uploadResult.url })

		// Lấy team detail kèm members
		const team = await teamService.getTeamDetail({ id: teamId }, (req as any).userId)
		const members = (team?.members || []).map((m: any) => ({
			id: m.user?.id,
			name: m.user?.name,
			email: m.user?.email,
			role: m.role
		}))

		return new OKResponse(
			'AI generated project schedule successfully!',
			200,
			await aiGenService.generateProjectSchedule(file.path, members)
		).send(res)
	}
}

const projectController = new ProjectController()

export default projectController
