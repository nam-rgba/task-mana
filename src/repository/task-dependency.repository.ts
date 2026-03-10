import { AppDataSource } from '~/db/data-source.js'
import { TaskDependency } from '~/model/task-dependency.entity.js'

export const getTaskDependencyRepository = () => {
	const repo = AppDataSource.getRepository(TaskDependency)

	const findOneById = async (id: number): Promise<TaskDependency | null> => {
		return await repo.findOneBy({ id })
	}

	const findByTaskId = async (taskId: number): Promise<{ predecessors: TaskDependency[]; successors: TaskDependency[] }> => {
		const [predecessors, successors] = await Promise.all([
			repo.find({ where: { successorId: taskId } }),
			repo.find({ where: { predecessorId: taskId } })
		])
		return { predecessors, successors }
	}

	const findSuccessors = async (taskId: number): Promise<TaskDependency[]> => {
		return await repo.find({ where: { predecessorId: taskId } })
	}

	const findByProjectTasks = async (taskIds: number[]): Promise<TaskDependency[]> => {
		if (taskIds.length === 0) return []
		return await repo
			.createQueryBuilder('dep')
			.where('dep.predecessorId IN (:...taskIds)', { taskIds })
			.orWhere('dep.successorId IN (:...taskIds)', { taskIds })
			.getMany()
	}

	const findExisting = async (predecessorId: number, successorId: number): Promise<TaskDependency | null> => {
		return await repo.findOneBy({ predecessorId, successorId })
	}

	const create = async (data: Partial<TaskDependency>): Promise<TaskDependency> => {
		const dep = repo.create(data)
		return await repo.save(dep)
	}

	const remove = async (id: number): Promise<boolean> => {
		const result = await repo.delete(id)
		return !!(result.affected && result.affected > 0)
	}

	return {
		findOneById,
		findByTaskId,
		findSuccessors,
		findByProjectTasks,
		findExisting,
		create,
		remove
	}
}
