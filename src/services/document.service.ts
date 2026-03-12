import { getDocumentRepository } from '~/repository/document.repository.js'
import { CloudinaryService } from '~/services/upload/cloudinary.service.js'
import { DocumentType } from '~/model/enums/document.enum.js'
import { BadRequestError, NotFoundError } from '~/utils/error.reponse.js'
import { Document } from '~/model/document.entity.js'
import { getProjectRepository } from '~/repository/project.repository.js'
import { getTaskRepository } from '~/repository/task.repository.js'
import fs from 'fs'
import path from 'path'

export class DocumentService {
	private repo = getDocumentRepository()
	private projectRepo = getProjectRepository()
	private taskRepo = getTaskRepository()

	async uploadDocument(
		file: Express.Multer.File,
		data: { type: DocumentType; projectId: number; taskId?: number; uploadedById?: number }
	): Promise<Document> {
		// Task documents phải có taskId
		if (
			(data.type === DocumentType.TASK_DESCRIPTION ||
				data.type === DocumentType.TASK_RESULT ||
				data.type === DocumentType.COMMENT) &&
			!data.taskId
		) {
			throw new BadRequestError('taskId is required for task documents')
		}

		// Project documents không cần taskId
		if (data.type === DocumentType.PROJECT && data.taskId) {
			throw new BadRequestError('taskId should not be provided for project documents')
		}

		const absolutePath = path.resolve(file.path)

		const isImage = file.mimetype.startsWith('image/')
		const uploadResult = await CloudinaryService.uploadImageFromLocal({
			filePath: absolutePath,
			folder: `documents/project-${data.projectId}`,
			resourceType: isImage ? 'image' : 'raw',
			fileName: file.originalname
		})

		// Xóa file tạm sau khi upload
		fs.unlink(absolutePath, () => {})

		const document = await this.repo.create({
			name: file.originalname,
			url: uploadResult.url,
			mimeType: file.mimetype,
			size: file.size,
			type: data.type,
			projectId: data.projectId,
			taskId: data.taskId,
			uploadedById: data.uploadedById
		})

		// Cập nhật documentIds array trong Project hoặc Task
		if (data.type === DocumentType.PROJECT) {
			const project = await this.projectRepo.findOneById(data.projectId)
			if (project) {
				const currentIds = project.documentIds || []
				project.documentIds = [...currentIds, document.id]
				await this.projectRepo.update(data.projectId, { documentIds: project.documentIds })
			}
		} else if (data.type === DocumentType.TASK_DESCRIPTION && data.taskId) {
			const task = await this.taskRepo.findOne(data.taskId)
			if (task) {
				const currentIds = task.descriptionDocumentIds || []
				task.descriptionDocumentIds = [...currentIds, document.id]
				await this.taskRepo.update(data.taskId, { descriptionDocumentIds: task.descriptionDocumentIds })
			}
		} else if (data.type === DocumentType.TASK_RESULT && data.taskId) {
			const task = await this.taskRepo.findOne(data.taskId)
			if (task) {
				const currentIds = task.resultDocumentIds || []
				task.resultDocumentIds = [...currentIds, document.id]
				await this.taskRepo.update(data.taskId, { resultDocumentIds: task.resultDocumentIds })
			}
		}

		return document
	}

	async getProjectDocuments(projectId: number): Promise<Document[]> {
		return this.repo.findByProject(projectId)
	}

	async getTaskDocuments(taskId: number, type?: DocumentType): Promise<Document[]> {
		return this.repo.findByTask(taskId, type)
	}

	async deleteDocument(id: number): Promise<boolean> {
		const doc = await this.repo.findById(id)
		if (!doc) throw new NotFoundError('Document not found')

		// Xóa document ID from Project hoặc Task arrays
		if (doc.type === DocumentType.PROJECT && doc.projectId) {
			const project = await this.projectRepo.findOneById(doc.projectId)
			if (project && project.documentIds) {
				project.documentIds = project.documentIds.filter((id) => id !== doc.id)
				await this.projectRepo.update(doc.projectId, { documentIds: project.documentIds })
			}
		} else if (doc.type === DocumentType.TASK_DESCRIPTION && doc.taskId) {
			const task = await this.taskRepo.findOne(doc.taskId)
			if (task && task.descriptionDocumentIds) {
				task.descriptionDocumentIds = task.descriptionDocumentIds.filter((id) => id !== doc.id)
				await this.taskRepo.update(doc.taskId, { descriptionDocumentIds: task.descriptionDocumentIds })
			}
		} else if (doc.type === DocumentType.TASK_RESULT && doc.taskId) {
			const task = await this.taskRepo.findOne(doc.taskId)
			if (task && task.resultDocumentIds) {
				task.resultDocumentIds = task.resultDocumentIds.filter((id) => id !== doc.id)
				await this.taskRepo.update(doc.taskId, { resultDocumentIds: task.resultDocumentIds })
			}
		}

		return this.repo.remove(id)
	}
}

export const documentService = new DocumentService()
