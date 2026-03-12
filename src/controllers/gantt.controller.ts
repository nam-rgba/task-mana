import { Request, Response, NextFunction } from 'express'
import { ganttService } from '~/services/gantt.service.js'
import { taskDependencyService } from '~/services/task-dependency.service.js'
import { aiGenService } from '~/services/ai/ai-gen.service.js'
import { OKResponse, CreatedResponse } from '~/utils/success.response.js'
import { BadRequestError } from '~/utils/error.reponse.js'

interface MulterRequest extends Request {
	file?: Express.Multer.File
}

class GanttController {
	getGanttData = async (req: Request, res: Response, next: NextFunction) => {
		const projectId = Number(req.params.projectId)
		const filters = {
			startDate: req.query.startDate ? Number(req.query.startDate) : undefined,
			endDate: req.query.endDate ? Number(req.query.endDate) : undefined,
			assigneeId: req.query.assigneeId ? Number(req.query.assigneeId) : undefined,
			status: req.query.status as string | undefined,
			scheduleId: req.query.scheduleId ? Number(req.query.scheduleId) : undefined
		}
		new OKResponse('Get gantt data successfully!', 200, await ganttService.getGanttData(projectId, filters)).send(res)
	}

	updateSchedule = async (req: Request, res: Response, next: NextFunction) => {
		const projectId = Number(req.params.projectId)
		const { taskUpdates, scheduleUpdates, autoSchedule } = req.body
		const result = await ganttService.updateSchedule(
			projectId,
			taskUpdates || [],
			scheduleUpdates || [],
			autoSchedule ?? true
		)
		new OKResponse('Schedule updated successfully!', 200, result).send(res)
	}

	// ─── Task Dependencies ───

	getDependencies = async (req: Request, res: Response, next: NextFunction) => {
		const taskId = Number(req.params.taskId)
		new OKResponse('Get dependencies successfully!', 200, await taskDependencyService.getDependencies(taskId)).send(res)
	}

	addDependency = async (req: Request, res: Response, next: NextFunction) => {
		const successorId = Number(req.params.taskId)
		new CreatedResponse(
			'Dependency added successfully!',
			201,
			await taskDependencyService.addDependency(successorId, req.body)
		).send(res)
	}

	removeDependency = async (req: Request, res: Response, next: NextFunction) => {
		const depId = Number(req.params.depId)
		await taskDependencyService.removeDependency(depId)
		new OKResponse('Dependency removed successfully!', 200, null).send(res)
	}

	// ─── SSE: Generate schedules + tasks from document ───

	generate = async (req: MulterRequest, res: Response, next: NextFunction) => {
		const projectId = Number(req.params.projectId)
		const userId = Number(req.headers['x-user-id']) || undefined
		if (!req.file) throw new BadRequestError('File is required')

		// SSE headers
		res.writeHead(200, {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		})

		await aiGenService.generateProjectWithSSE(req.file.path, projectId, res, {
			userId,
			requestType: 'vision',
			metadata: {
				projectId
			}
		})
	}
}

export const ganttController = new GanttController()
