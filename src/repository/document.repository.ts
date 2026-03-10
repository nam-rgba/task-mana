import { AppDataSource } from '~/db/data-source.js'
import { Document } from '~/model/document.entity.js'
import { DocumentType } from '~/model/enums/document.enum.js'

export const getDocumentRepository = () => {
	const repo = AppDataSource.getRepository(Document)

	const findById = async (id: number): Promise<Document | null> => {
		return await repo.findOneBy({ id })
	}

	const findByProject = async (projectId: number): Promise<Document[]> => {
		return await repo.find({
			where: { projectId, type: DocumentType.PROJECT },
			order: { createdAt: 'DESC' }
		})
	}

	const findByTask = async (taskId: number, type?: DocumentType): Promise<Document[]> => {
		const where: any = { taskId }
		if (type) where.type = type
		return await repo.find({ where, order: { createdAt: 'DESC' } })
	}

	const create = async (data: Partial<Document>): Promise<Document> => {
		const doc = repo.create(data)
		return await repo.save(doc)
	}

	const remove = async (id: number): Promise<boolean> => {
		const result = await repo.delete(id)
		return !!result.affected && result.affected > 0
	}

	return { findById, findByProject, findByTask, create, remove }
}
