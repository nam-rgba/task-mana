import { getDocumentRepository } from '~/repository/document.repository.js'
import { CloudinaryService } from '~/services/upload/cloudinary.service.js'
import { DocumentType } from '~/model/enums/document.enum.js'
import { BadRequestError, NotFoundError } from '~/utils/error.reponse.js'
import { Document } from '~/model/document.entity.js'
import fs from 'fs'
import path from 'path'

export class DocumentService {
	private repo = getDocumentRepository()

	async uploadDocument(
		file: Express.Multer.File,
		data: { type: DocumentType; projectId: number; taskId?: number; uploadedById?: number }
	): Promise<Document> {
		// Task documents phải có taskId
		if ((data.type === DocumentType.TASK_DESCRIPTION || data.type === DocumentType.TASK_RESULT) && !data.taskId) {
			throw new BadRequestError('taskId is required for task documents')
		}

		// Project documents không cần taskId
		if (data.type === DocumentType.PROJECT && data.taskId) {
			throw new BadRequestError('taskId should not be provided for project documents')
		}

		const absolutePath = path.resolve(file.path)

		const uploadResult = await CloudinaryService.uploadImageFromLocal({
			filePath: absolutePath,
			folder: `documents/project-${data.projectId}`
		})

		// Xóa file tạm sau khi upload
		fs.unlink(absolutePath, () => {})

		return this.repo.create({
			name: file.originalname,
			url: uploadResult.url,
			mimeType: file.mimetype,
			size: file.size,
			type: data.type,
			projectId: data.projectId,
			taskId: data.taskId,
			uploadedById: data.uploadedById
		})
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
		return this.repo.remove(id)
	}
}

export const documentService = new DocumentService()
