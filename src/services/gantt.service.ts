import { AppDataSource } from '~/db/data-source.js'
import { Task } from '~/model/task.entity.js'
import { Schedule } from '~/model/schedule.entity.js'
import { TaskStatus } from '~/types/task.type.js'
import { getScheduleRepository } from '~/repository/schedule.repository.js'
import { getTaskDependencyRepository } from '~/repository/task-dependency.repository.js'
import { getMilestoneRepository } from '~/repository/milestone.repository.js'
import { getProjectRepository } from '~/repository/project.repository.js'
import { taskDependencyService } from './task-dependency.service.js'
import { NotFoundError } from '~/utils/error.reponse.js'
import type {
	GanttResponse,
	GanttScheduleGroup,
	GanttTaskDto,
	GanttFilters,
	TaskScheduleUpdate,
	ScheduleDateUpdate,
	DependencyLink
} from '~/types/gantt.type.js'

class GanttService {
	private projectRepo = getProjectRepository()
	private scheduleRepo = getScheduleRepository()
	private depRepo = getTaskDependencyRepository()
	private milestoneRepo = getMilestoneRepository()

	async getGanttData(projectId: number, filters?: GanttFilters): Promise<GanttResponse> {
		const project = await this.projectRepo.findOneById(projectId)
		if (!project) throw new NotFoundError(`Project with id ${projectId} not found`)

		// Query tasks
		const taskRepo = AppDataSource.getRepository(Task)
		const taskQuery = taskRepo
			.createQueryBuilder('task')
			.leftJoinAndSelect('task.assignee', 'assignee')
			.leftJoinAndSelect('task.reviewer', 'reviewer')
			.where('task.projectId = :projectId', { projectId })
			.orderBy('task.scheduleId', 'ASC', 'NULLS LAST')
			.addOrderBy('task.sortOrder', 'ASC')

		if (filters?.assigneeId) {
			taskQuery.andWhere('task.assigneeId = :assigneeId', { assigneeId: filters.assigneeId })
		}
		if (filters?.status) {
			const statuses = filters.status.split(',')
			taskQuery.andWhere('task.status IN (:...statuses)', { statuses })
		}
		if (filters?.scheduleId) {
			taskQuery.andWhere('task.scheduleId = :scheduleId', { scheduleId: filters.scheduleId })
		}
		if (filters?.startDate) {
			taskQuery.andWhere('(task.startDate >= :filterStart OR task.dueDate >= :filterStart)', { filterStart: filters.startDate })
		}
		if (filters?.endDate) {
			taskQuery.andWhere('(task.startDate <= :filterEnd OR task.dueDate <= :filterEnd)', { filterEnd: filters.endDate })
		}

		const [tasks, schedules, milestones] = await Promise.all([
			taskQuery.getMany(),
			this.scheduleRepo.findByProject(projectId),
			this.milestoneRepo.findByProject(projectId)
		])

		// Query dependencies
		const taskIds = tasks.map((t) => t.id)
		const dependencies = await this.depRepo.findByProjectTasks(taskIds)

		// Build dependency lookup
		const predMap = new Map<number, DependencyLink[]>() // taskId → predecessors
		const succMap = new Map<number, DependencyLink[]>() // taskId → successors

		for (const dep of dependencies) {
			// predecessor link for successor task
			const predLinks = predMap.get(dep.successorId) || []
			predLinks.push({ dependencyId: dep.id, taskId: dep.predecessorId, type: dep.type, lagDays: dep.lagDays })
			predMap.set(dep.successorId, predLinks)

			// successor link for predecessor task
			const succLinks = succMap.get(dep.predecessorId) || []
			succLinks.push({ dependencyId: dep.id, taskId: dep.successorId, type: dep.type, lagDays: dep.lagDays })
			succMap.set(dep.predecessorId, succLinks)
		}

		// Map tasks to GanttTaskDto
		const toGanttTask = (task: Task): GanttTaskDto => ({
			id: task.id,
			title: task.title,
			startDate: task.startDate ?? null,
			dueDate: task.dueDate ?? null,
			duration: task.duration ?? null,
			status: task.status,
			type: task.type,
			priority: (task.priority as any) ?? null,
			completedPercent: task.completedPercent ?? 0,
			sortOrder: task.sortOrder ?? 0,
			scheduleId: task.scheduleId ?? null,
			projectId: task.projectId!,
			assignee: task.assignee ? { id: task.assignee.id, name: task.assignee.name, avatarUrl: (task.assignee as any).avatarUrl } : null,
			reviewer: task.reviewer ? { id: task.reviewer.id, name: task.reviewer.name } : null,
			predecessors: predMap.get(task.id) || [],
			successors: succMap.get(task.id) || []
		})

		// Group tasks by schedule
		const scheduleGroups: GanttScheduleGroup[] = schedules.map((schedule) => {
			const scheduleTasks = tasks.filter((t) => t.scheduleId === schedule.id).map(toGanttTask)
			const completedCount = scheduleTasks.filter((t) => t.status === TaskStatus.Done).length
			const totalProgress =
				scheduleTasks.length > 0 ? Math.round(scheduleTasks.reduce((sum, t) => sum + t.completedPercent, 0) / scheduleTasks.length) : 0

			return {
				schedule: {
					id: schedule.id,
					name: schedule.name,
					description: schedule.description,
					startDate: schedule.startDate,
					endDate: schedule.endDate,
					status: schedule.status,
					color: schedule.color,
					projectId: schedule.projectId,
					sortOrder: schedule.sortOrder,
					progress: totalProgress,
					taskCount: scheduleTasks.length,
					completedTaskCount: completedCount
				},
				tasks: scheduleTasks
			}
		})

		const unscheduledTasks = tasks.filter((t) => !t.scheduleId).map(toGanttTask)

		// Summary
		const allGanttTasks = [...scheduleGroups.flatMap((g) => g.tasks), ...unscheduledTasks]
		const completedTasks = allGanttTasks.filter((t) => t.status === TaskStatus.Done).length
		const overallProgress =
			allGanttTasks.length > 0
				? Math.round(allGanttTasks.reduce((sum, t) => sum + t.completedPercent, 0) / allGanttTasks.length)
				: 0

		// Date range
		const allDates = allGanttTasks.flatMap((t) => [t.startDate, t.dueDate].filter((d): d is number => d !== null))
		const milestoneDates = milestones.map((m) => m.dueDate)
		const scheduleDates = schedules.flatMap((s) => [s.startDate, s.endDate])
		const allTimestamps = [...allDates, ...milestoneDates, ...scheduleDates]

		const earliest = allTimestamps.length > 0 ? Math.min(...allTimestamps) : 0
		const latest = allTimestamps.length > 0 ? Math.max(...allTimestamps) : 0

		// Critical path
		const criticalPath = this.calculateCriticalPath(allGanttTasks, dependencies)

		return {
			project: {
				id: project.id,
				name: project.name,
				startDate: project.startDate ?? null,
				endDate: project.endDate ?? null,
				status: project.status
			},
			schedules: scheduleGroups,
			unscheduledTasks,
			milestones: milestones.map((m) => ({
				id: m.id,
				name: m.name,
				description: m.description,
				dueDate: m.dueDate,
				status: m.status,
				color: m.color,
				projectId: m.projectId,
				scheduleId: m.scheduleId ?? null,
				sortOrder: m.sortOrder
			})),
			dependencies: dependencies.map((d) => ({
				id: d.id,
				predecessorId: d.predecessorId,
				successorId: d.successorId,
				type: d.type,
				lagDays: d.lagDays
			})),
			summary: {
				totalTasks: allGanttTasks.length,
				completedTasks,
				overallProgress,
				criticalPath,
				dateRange: { earliest, latest }
			}
		}
	}

	async updateSchedule(
		projectId: number,
		taskUpdates: TaskScheduleUpdate[],
		scheduleUpdates: ScheduleDateUpdate[],
		autoSchedule: boolean
	) {
		const taskRepo = AppDataSource.getRepository(Task)
		const scheduleRepo = AppDataSource.getRepository(Schedule)

		const updatedTasks: { id: number; startDate: number; dueDate: number }[] = []
		const updatedSchedules: { id: number; startDate: number; endDate: number }[] = []

		// Update tasks
		for (const tu of taskUpdates) {
			const task = await taskRepo.findOneBy({ id: tu.taskId, projectId })
			if (!task) continue
			task.startDate = tu.startDate
			task.dueDate = tu.dueDate
			if (task.startDate && task.dueDate) {
				task.duration = Math.ceil((task.dueDate - task.startDate) / 86400)
			}
			await taskRepo.save(task)
			updatedTasks.push({ id: task.id, startDate: task.startDate, dueDate: task.dueDate })

			if (autoSchedule) {
				const cascaded = await taskDependencyService.cascadeSchedule(task.id)
				updatedTasks.push(...cascaded)
			}
		}

		// Update schedules
		for (const su of scheduleUpdates) {
			const schedule = await scheduleRepo.findOneBy({ id: su.scheduleId, projectId })
			if (!schedule) continue
			schedule.startDate = su.startDate
			schedule.endDate = su.endDate
			await scheduleRepo.save(schedule)
			updatedSchedules.push({ id: schedule.id, startDate: schedule.startDate, endDate: schedule.endDate })
		}

		return { updatedTasks, updatedSchedules }
	}

	/**
	 * Calculate critical path using forward/backward pass.
	 * Returns array of task IDs on the critical path.
	 */
	private calculateCriticalPath(
		tasks: GanttTaskDto[],
		deps: { predecessorId: number; successorId: number; lagDays: number }[]
	): number[] {
		if (tasks.length === 0 || deps.length === 0) return []

		const taskMap = new Map(tasks.map((t) => [t.id, t]))
		const inDegree = new Map<number, number>()
		const adjList = new Map<number, { successorId: number; lagDays: number }[]>()
		const reverseAdj = new Map<number, { predecessorId: number; lagDays: number }[]>()

		for (const t of tasks) {
			inDegree.set(t.id, 0)
			adjList.set(t.id, [])
			reverseAdj.set(t.id, [])
		}

		for (const d of deps) {
			if (!taskMap.has(d.predecessorId) || !taskMap.has(d.successorId)) continue
			adjList.get(d.predecessorId)!.push({ successorId: d.successorId, lagDays: d.lagDays })
			reverseAdj.get(d.successorId)!.push({ predecessorId: d.predecessorId, lagDays: d.lagDays })
			inDegree.set(d.successorId, (inDegree.get(d.successorId) || 0) + 1)
		}

		// Topological sort (Kahn's algorithm)
		const queue: number[] = []
		for (const [id, deg] of inDegree) {
			if (deg === 0) queue.push(id)
		}

		const topoOrder: number[] = []
		while (queue.length > 0) {
			const current = queue.shift()!
			topoOrder.push(current)
			for (const edge of adjList.get(current) || []) {
				const newDeg = (inDegree.get(edge.successorId) || 1) - 1
				inDegree.set(edge.successorId, newDeg)
				if (newDeg === 0) queue.push(edge.successorId)
			}
		}

		if (topoOrder.length === 0) return []

		// Forward pass: Early Start (ES) & Early Finish (EF)
		const ES = new Map<number, number>()
		const EF = new Map<number, number>()

		for (const id of topoOrder) {
			const task = taskMap.get(id)!
			const duration = task.duration ?? 1
			let es = 0

			for (const pred of reverseAdj.get(id) || []) {
				const predEF = EF.get(pred.predecessorId) ?? 0
				es = Math.max(es, predEF + pred.lagDays)
			}

			ES.set(id, es)
			EF.set(id, es + duration)
		}

		// Backward pass: Late Start (LS) & Late Finish (LF)
		const projectEnd = Math.max(...Array.from(EF.values()))
		const LS = new Map<number, number>()
		const LF = new Map<number, number>()

		for (let i = topoOrder.length - 1; i >= 0; i--) {
			const id = topoOrder[i]
			const task = taskMap.get(id)!
			const duration = task.duration ?? 1
			let lf = projectEnd

			for (const succ of adjList.get(id) || []) {
				const succLS = LS.get(succ.successorId) ?? projectEnd
				lf = Math.min(lf, succLS - succ.lagDays)
			}

			LF.set(id, lf)
			LS.set(id, lf - duration)
		}

		// Critical path: float == 0
		const critical: number[] = []
		for (const id of topoOrder) {
			const es = ES.get(id) ?? 0
			const ls = LS.get(id) ?? 0
			if (Math.abs(ls - es) < 0.001) {
				critical.push(id)
			}
		}

		return critical
	}
}

export const ganttService = new GanttService()
