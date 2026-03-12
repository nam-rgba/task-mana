import { AppDataSource } from '~/db/data-source.js'
import { TaskComment } from '~/model/task-comment.entity.js'

export const getTaskCommentRepository = () => {
	const repo = AppDataSource.getRepository(TaskComment)

	const create = async (data: Partial<TaskComment>): Promise<TaskComment> => {
		const comment = repo.create(data)
		return await repo.save(comment)
	}

	const findByTaskId = async (taskId: number): Promise<TaskComment[]> => {
		return await repo
			.createQueryBuilder('comment')
			.leftJoin('comment.author', 'author')
			.leftJoinAndSelect('comment.document', 'document')
			.addSelect(['author.id', 'author.name', 'author.email', 'author.avatar', 'author.position'])
			.where('comment.taskId = :taskId', { taskId })
			.orderBy('comment.createdAt', 'ASC')
			.getMany()
	}

	const findOneById = async (id: number): Promise<TaskComment | null> => {
		return await repo
			.createQueryBuilder('comment')
			.leftJoin('comment.author', 'author')
			.leftJoinAndSelect('comment.document', 'document')
			.addSelect(['author.id', 'author.name', 'author.email', 'author.avatar', 'author.position'])
			.where('comment.id = :id', { id })
			.getOne()
	}

	return { create, findByTaskId, findOneById }
}
