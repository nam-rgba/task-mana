import dayjs from 'dayjs'
import { Between } from 'typeorm'
import { AppDataSource } from '~/db/data-source.js'
import { Task } from '~/model/task.entity.js'
import { TaskStatus } from '~/types/task.type.js'

interface DashboardStats {
	assignedTasks: number
	completedTasks: number
	totalStoryPoints: number
}

interface TaskPerProject {
	projectId: number
	projectName: string
	count: number
}

interface TaskPerDay {
	date: string
	count: number
}

interface SPPerDay {
	date: string
	totalStoryPoints: number
}

interface DashboardResponse {
	stats: DashboardStats
	taskPerProjects: TaskPerProject[]
	taskPerDays: TaskPerDay[]
	spPerDay: SPPerDay[]
}

class DashboardService {
	/**
	 * Get dashboard stats for a user
	 * @param userId - User ID
	 * @param startAt - Start date (unix timestamp)
	 * @param endAt - End date (unix timestamp)
	 * @param justForMe - If true, only get stats for tasks assigned to the user. If false, get stats for all team tasks
	 */
	async getDashboardStats(
		userId: number,
		startAt: number,
		endAt: number,
		justForMe: boolean = true
	): Promise<DashboardResponse> {
		const taskRepo = AppDataSource.getRepository(Task)

			// Convert unix timestamps to UTC start of day and next day for end
			const startDate = dayjs.unix(startAt).utc().startOf('day').toDate()
			const endDate = dayjs.unix(endAt).utc().add(1, 'day').startOf('day').toDate()

			// Base query builder
			const baseQuery = taskRepo
				.createQueryBuilder('task')
				.leftJoinAndSelect('task.project', 'project')
				.where('task.createdAt >= :startDate AND task.createdAt < :endDate', { startDate, endDate })

		// If justForMe is false, filter by team membership
		if (!justForMe) {
			baseQuery
				.innerJoin('project.team', 'team')
				.innerJoin('team.members', 'teamMember')
				.andWhere('teamMember.userId = :userId', { userId })
				.andWhere('teamMember.isActive = :isActive', { isActive: true })
		} else {
			// If justForMe is true, only filter by assignee
			baseQuery.andWhere('task.assigneeId = :userId', { userId })
		}

		// Get stats: assigned tasks, completed tasks, total story points
		const statsQuery = baseQuery.clone()
		const stats = await statsQuery
			.select('COUNT(task.id)', 'assignedTasks')
			.addSelect('SUM(task.estimateEffort)', 'totalStoryPoints')
			.getRawOne()

		// Count completed tasks
		const completedQuery = baseQuery.clone().andWhere('task.status = :status', { status: TaskStatus.Done })
		const completed = await completedQuery.select('COUNT(task.id)', 'completedTasks').getRawOne()

		// Get tasks per project
		const taskPerProjectQuery = baseQuery
			.clone()
			.select('project.id', 'projectId')
			.addSelect('project.name', 'projectName')
			.addSelect('COUNT(task.id)', 'count')
			.groupBy('project.id')
			.addGroupBy('project.name')
			.orderBy('count', 'DESC')

		const taskPerProjects = await taskPerProjectQuery.getRawMany()

		// Get tasks per day
		const taskPerDayQuery = baseQuery
			.clone()
			.select("DATE(task.createdAt AT TIME ZONE 'UTC')", 'date')
			.addSelect('COUNT(task.id)', 'count')
			.groupBy("DATE(task.createdAt AT TIME ZONE 'UTC')")
			.orderBy('date', 'ASC')

		const taskPerDays = await taskPerDayQuery.getRawMany()

		// Get story points per day
		const spPerDayQuery = baseQuery
			.clone()
			.select("DATE(task.createdAt AT TIME ZONE 'UTC')", 'date')
			.addSelect('SUM(task.estimateEffort)', 'totalStoryPoints')
			.groupBy("DATE(task.createdAt AT TIME ZONE 'UTC')")
			.orderBy('date', 'ASC')

		const spPerDay = await spPerDayQuery.getRawMany()

		return {
			stats: {
				assignedTasks: Number(stats?.assignedTasks) || 0,
				completedTasks: Number(completed?.completedTasks) || 0,
				totalStoryPoints: parseFloat(stats?.totalStoryPoints) || 0
			},
			taskPerProjects: taskPerProjects.map((item) => ({
				projectId: item.projectId,
				projectName: item.projectName,
				count: Number(item.count)
			})),
			taskPerDays: taskPerDays.map((item) => ({
				date: item.date,
				count: Number(item.count)
			})),
			spPerDay: spPerDay.map((item) => ({
				date: item.date,
				totalStoryPoints: parseFloat(item.totalStoryPoints) || 0
			}))
		}
	}
}

export const dashboardService = new DashboardService()
export default dashboardService
