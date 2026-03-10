import { AppDataSource } from '~/db/data-source.js'
import { Task } from '~/model/task.entity.js'
import { TaskDependency } from '~/model/task-dependency.entity.js'
import { CreateDependencyDto } from '~/model/dto/gantt.dto.js'
import { DependencyType } from '~/model/enums/gantt.enum.js'
import { getTaskDependencyRepository } from '~/repository/task-dependency.repository.js'
import { BadRequestError, ConflictError, NotFoundError } from '~/utils/error.reponse.js'

const DAY = 86400

class TaskDependencyService {
	private depRepo = getTaskDependencyRepository()

	async getDependencies(taskId: number) {
		return await this.depRepo.findByTaskId(taskId)
	}

	async addDependency(successorId: number, data: CreateDependencyDto) {
		const { predecessorId, type, lagDays } = data

		if (predecessorId === successorId) {
			throw new BadRequestError('A task cannot depend on itself')
		}

		const taskRepo = AppDataSource.getRepository(Task)
		const [predecessor, successor] = await Promise.all([
			taskRepo.findOneBy({ id: predecessorId }),
			taskRepo.findOneBy({ id: successorId })
		])

		if (!predecessor) throw new NotFoundError(`Predecessor task ${predecessorId} not found`)
		if (!successor) throw new NotFoundError(`Successor task ${successorId} not found`)

		if (predecessor.projectId !== successor.projectId) {
			throw new BadRequestError('Both tasks must belong to the same project')
		}

		// Check duplicate
		const existing = await this.depRepo.findExisting(predecessorId, successorId)
		if (existing) throw new ConflictError('This dependency already exists')

		// Check circular
		const isCircular = await this.detectCircular(predecessorId, successorId)
		if (isCircular) throw new ConflictError('Adding this dependency would create a circular reference')

		return await this.depRepo.create({ predecessorId, successorId, type, lagDays })
	}

	async removeDependency(depId: number) {
		const dep = await this.depRepo.findOneById(depId)
		if (!dep) throw new NotFoundError(`Dependency ${depId} not found`)
		return await this.depRepo.remove(depId)
	}

	/**
	 * Detect circular dependency using DFS.
	 * Check if adding predecessorId → successorId would create a cycle
	 * by verifying successorId cannot reach predecessorId through existing deps.
	 */
	private async detectCircular(predecessorId: number, successorId: number): Promise<boolean> {
		const visited = new Set<number>()
		const stack = [successorId]

		while (stack.length > 0) {
			const current = stack.pop()!
			if (current === predecessorId) return true
			if (visited.has(current)) continue
			visited.add(current)

			const successors = await this.depRepo.findSuccessors(current)
			for (const dep of successors) {
				stack.push(dep.successorId)
			}
		}

		return false
	}

	/**
	 * Cascade reschedule all successor tasks after a task's dates change.
	 * Only pushes tasks later, never pulls them earlier.
	 */
	async cascadeSchedule(taskId: number, visited = new Set<number>()): Promise<{ id: number; startDate: number; dueDate: number }[]> {
		if (visited.has(taskId)) return []
		visited.add(taskId)

		const taskRepo = AppDataSource.getRepository(Task)
		const task = await taskRepo.findOneBy({ id: taskId })
		if (!task) return []

		const successorDeps = await this.depRepo.findSuccessors(taskId)
		const result: { id: number; startDate: number; dueDate: number }[] = []

		for (const dep of successorDeps) {
			const successor = await taskRepo.findOneBy({ id: dep.successorId })
			if (!successor || !successor.startDate || !successor.dueDate) continue

			const newStart = this.calculateNewStart(task, successor, dep)
			if (newStart === null || newStart <= successor.startDate) continue

			const delta = newStart - successor.startDate
			successor.startDate = newStart
			successor.dueDate = successor.dueDate + delta

			await taskRepo.save(successor)
			result.push({ id: successor.id, startDate: successor.startDate, dueDate: successor.dueDate })

			const cascaded = await this.cascadeSchedule(successor.id, visited)
			result.push(...cascaded)
		}

		return result
	}

	private calculateNewStart(pred: Task, succ: Task, dep: TaskDependency): number | null {
		if (!pred.startDate || !pred.dueDate) return null

		const duration = succ.duration ?? 0
		switch (dep.type) {
			case DependencyType.FS:
				return pred.dueDate + (1 + dep.lagDays) * DAY
			case DependencyType.SS:
				return pred.startDate + dep.lagDays * DAY
			case DependencyType.FF:
				return pred.dueDate + dep.lagDays * DAY - duration * DAY
			case DependencyType.SF:
				return pred.startDate + dep.lagDays * DAY - duration * DAY
			default:
				return null
		}
	}
}

export const taskDependencyService = new TaskDependencyService()
