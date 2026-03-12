import { getTaskCommentRepository } from '~/repository/task-comment.repository.js'
import { getTaskRepository } from '~/repository/task.repository.js'
import { BadRequestError, NotFoundError } from '~/utils/error.reponse.js'
import { TaskComment } from '~/model/task-comment.entity.js'
import { documentService } from '~/services/document.service.js'
import { DocumentType } from '~/model/enums/document.enum.js'

const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/gif',
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
])

export class TaskCommentService {
	private repo = getTaskCommentRepository()
	private taskRepo = getTaskRepository()

	async getTaskComments(taskId: number): Promise<TaskComment[]> {
		const task = await this.taskRepo.findOne(taskId)
		if (!task) {
			throw new NotFoundError('Task not found')
		}

		return await this.repo.findByTaskId(taskId)
	}

	async createTaskComment(
		taskId: number,
		data: { content?: string; authorId?: number },
		file?: Express.Multer.File
	): Promise<TaskComment> {
		const task = await this.taskRepo.findOne(taskId)
		if (!task) {
			throw new NotFoundError('Task not found')
		}

		const content = data.content?.trim()
		if (!content && !file) {
			throw new BadRequestError('content or attachment is required')
		}

		const authorId = Number(data.authorId)
		if (!Number.isInteger(authorId) || authorId <= 0) {
			throw new BadRequestError('x-user-id header is required to create comment')
		}

		let documentId: number | undefined

		if (file) {
			if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(file.mimetype)) {
				throw new BadRequestError('Only image, PDF, Word, Excel files are allowed')
			}

			if (!task.projectId) {
				throw new BadRequestError('Task projectId is required to upload comment attachment')
			}

			const document = await documentService.uploadDocument(file, {
				type: DocumentType.COMMENT,
				projectId: task.projectId,
				taskId,
				uploadedById: authorId
			})

			documentId = document.id
		}

		const created = await this.repo.create({
			taskId,
			authorId,
			content: content || undefined,
			documentId
		})

		const comment = await this.repo.findOneById(created.id)
		if (!comment) {
			throw new NotFoundError('Comment not found after creation')
		}

		return comment
	}
}

export const taskCommentService = new TaskCommentService()
