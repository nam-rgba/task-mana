import { Request, Response, NextFunction } from 'express'
import { documentService } from '~/services/document.service.js'
import { DocumentType } from '~/model/enums/document.enum.js'
import { BadRequestError } from '~/utils/error.reponse.js'
import { CreatedResponse, SuccessResponse } from '~/utils/success.response.js'

interface MulterRequest extends Request {
	file?: Express.Multer.File
}

class DocumentController {
	upload = async (req: MulterRequest, res: Response, next: NextFunction) => {
		const { file } = req
		if (!file) throw new BadRequestError('No file uploaded')

		const { type, projectId, taskId } = req.body

		new CreatedResponse(
			'Upload document successfully!',
			201,
			await documentService.uploadDocument(file, {
				type: type as DocumentType,
				projectId: Number(projectId),
				taskId: taskId ? Number(taskId) : undefined,
				uploadedById: (req as any).user?.id
			})
		).send(res)
	}

	getProjectDocuments = async (req: Request, res: Response, next: NextFunction) => {
		const projectId = Number(req.params.projectId)

		new SuccessResponse({
			message: 'Get project documents successfully!',
			statusCode: 200,
			metadata: await documentService.getProjectDocuments(projectId)
		}).send(res)
	}

	getTaskDocuments = async (req: Request, res: Response, next: NextFunction) => {
		const taskId = Number(req.params.taskId)
		const type = req.query.type as DocumentType | undefined

		new SuccessResponse({
			message: 'Get task documents successfully!',
			statusCode: 200,
			metadata: await documentService.getTaskDocuments(taskId, type)
		}).send(res)
	}

	deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
		const id = Number(req.params.id)
		await documentService.deleteDocument(id)

		new SuccessResponse({
			message: 'Delete document successfully!',
			statusCode: 200,
			metadata: null
		}).send(res)
	}
}

const documentController = new DocumentController()
export { documentController }
