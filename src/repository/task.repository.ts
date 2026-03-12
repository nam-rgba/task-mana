// src/repository/task.repository.ts
import dayjs from 'dayjs'
import { Between } from 'typeorm'
import { AppDataSource } from '~/db/data-source.js'
import { Task } from '~/model/task.entity.js'
import { TaskPriority, TaskStatus } from '~/types/task.type.js'

interface IQuery {
	page: number
	limit: number
	skip?: number
}

type QueryFilter = {
	q?: string
	title?: string
	completed?: boolean
	[key: string]: any
}

export interface TaskQuery {
	page: number
	limit: number
	status?: TaskStatus
	priority?: TaskPriority
	dueDate?: number
	assigneeId?: number
	qcId?: number
	projectId?: number
	teamId?: number
}

export interface PerformanceReviewTaskComment {
	id: number
	authorId: number
	authorName: string | null
	content: string
	createdAt: string
}

export interface PerformanceReviewTaskRow {
	id: number
	title: string
	description: string | null
	priority: TaskPriority | null
	status: TaskStatus
	estimateEffort: number
	actualEffort: number
	startDate: number | null
	dueDate: number | null
	completedAt: number | null
	comments: PerformanceReviewTaskComment[]
}

export interface TeamPerformanceDashboardRow {
	userId: number
	name: string
	email: string
	avatar: string | null
	position: string | null
	skills: string[] | null
	yearOfExperience: number
	totalTasks: string
	completedTasks: string
	onTimeCompletedTasks: string
	totalStoryPoints: string
	storyPointsAchieved: string
}

const normalizePaging = ({ page, limit, skip }: IQuery) => {
	let _limit = Number(limit) || 10
	if (_limit < 1) _limit = 10
	let _skip = Number(skip)
	if (Number.isNaN(_skip) || _skip < 0) {
		const _page = Number(page) || 1
		_skip = (_page - 1) * _limit
	}
	return { skip: _skip, limit: _limit, page }
}

const buildFilter = (query: QueryFilter = {}) => {
	const { assigneeId, dueDate } = query
	const filter: any = {}

	if (assigneeId !== undefined) {
		filter.where = {
			...filter.where,
			assigneeId: Number(assigneeId)
		}
	}

	// lọc ra các task mà ở trong những team mà userId là thành viên
	// filter.where = {
	// 	...filter.where,

	// }

	if (dueDate !== undefined) {
		const start = dayjs.unix(Number(dueDate)).startOf('day').unix()
		const end = dayjs.unix(Number(dueDate)).endOf('day').unix()
		filter.where = {
			...filter.where,
			dueDate: Between(start, end)
		}
		console.log(`Filtering tasks with dueDate between ${start} and ${end}, dueDate param: ${dueDate}`)
	}

	return filter
}

export const getTaskRepository = () => {
	const repo = AppDataSource.getRepository(Task)

	const findAll = async ({
		page = 1,
		limit = 10,
		query,
		sort = 'createdAt'
	}: {
		page?: number
		limit?: number
		skip?: number
		query?: QueryFilter
		sort?: string
	}) => {
		const { skip: _skip, limit: _limit } = normalizePaging({ page, limit })

		const filter = buildFilter(query)

		// Sử dụng QueryBuilder để chỉ select những fields cần thiết, tránh lộ thông tin nhạy cảm
		const qb = repo
			.createQueryBuilder('task')
			.leftJoinAndSelect('task.project', 'project')
			.leftJoin('task.assignee', 'assignee')
			.addSelect(['assignee.id', 'assignee.name', 'assignee.email', 'assignee.avatar', 'assignee.position'])
			.leftJoin('task.reviewer', 'reviewer')
			.addSelect(['reviewer.id', 'reviewer.name', 'reviewer.email', 'reviewer.avatar'])
			.skip(_skip)
			.take(_limit)
			.orderBy('task.createdAt', 'DESC')

		if (filter.where) {
			qb.where(filter.where)
		}

		const [tasks, total] = await qb.getManyAndCount()

		const currentPage = Math.floor(_skip / _limit) + 1
		const pages = Math.max(1, Math.ceil(total / _limit))

		return { tasks, page: { total, currentPage, pages } }
	}

	const findOne = async (id: number): Promise<Task | null> => {
		return await repo
			.createQueryBuilder('task')
			.leftJoinAndSelect('task.project', 'project')
			.leftJoinAndSelect('task.schedule', 'schedule')
			.leftJoin('task.assignee', 'assignee')
			.addSelect(['assignee.id', 'assignee.name', 'assignee.email', 'assignee.avatar', 'assignee.position'])
			.leftJoin('task.reviewer', 'reviewer')
			.addSelect(['reviewer.id', 'reviewer.name', 'reviewer.email', 'reviewer.avatar', 'reviewer.position'])
			.where('task.id = :id', { id })
			.getOne()
	}

	const create = async (data: Partial<Task>): Promise<Task> => {
		const task = repo.create(data)
		return await repo.save(task)
	}

	const update = async (id: number, data: Partial<Task>): Promise<Task | null> => {
		const task = await repo.findOneBy({ id })
		if (!task) return null
		const updated = repo.merge(task, data)
		return await repo.save(updated)
	}

	const remove = async (id: number): Promise<boolean> => {
		const result = await repo.delete(id)
		return !!result.affected && result.affected > 0
	}

	// Lấy tasks của user thông qua team membership - sử dụng QueryBuilder
	const findAllByQueryBuilder = async (
		userId: number,
		{
			page = 1,
			limit = 10,
			status,
			priority,
			dueDate
		}: {
			page?: number
			limit?: number
			status?: string
			priority?: string
			dueDate?: number
		} = {}
	) => {
		const { skip: _skip, limit: _limit } = normalizePaging({ page, limit })

		const qb = repo
			.createQueryBuilder('task')
			.innerJoin('task.project', 'project')
			.innerJoin('project.team', 'team')
			.innerJoin('team.members', 'teamMember')
			.leftJoin('task.assignee', 'assignee')
			.addSelect(['assignee.id', 'assignee.name', 'assignee.email', 'assignee.avatar'])
			.leftJoin('task.reviewer', 'reviewer')
			.addSelect(['reviewer.id', 'reviewer.name', 'reviewer.email', 'reviewer.avatar'])
			.leftJoinAndSelect('task.project', 'projectData')
			.where('teamMember.userId = :userId', { userId })
			.andWhere('teamMember.isActive = :isActive', { isActive: true })

		if (status) {
			qb.andWhere('task.status = :status', { status })
		}

		if (priority) {
			qb.andWhere('task.priority = :priority', { priority })
		}

		if (dueDate !== undefined) {
			const start = dayjs.unix(Number(dueDate)).startOf('day').unix()
			const end = dayjs.unix(Number(dueDate)).endOf('day').unix()
			qb.andWhere('task.dueDate BETWEEN :start AND :end', { start, end })
		}

		qb.orderBy('task.createdAt', 'DESC').skip(_skip).take(_limit)

		const [tasks, total] = await qb.getManyAndCount()

		const currentPage = Math.floor(_skip / _limit) + 1
		const pages = Math.max(1, Math.ceil(total / _limit))

		return { tasks, page: { total, currentPage, pages } }
	}

	// Lấy tasks theo team - sử dụng Raw Query
	const findAllByRawQuery = async (query: TaskQuery) => {
		const { page = 1, limit = 10, teamId, assigneeId, qcId, status, priority, projectId, dueDate } = query
		const { skip: _skip, limit: _limit } = normalizePaging({ page, limit })

		const params: any[] = [teamId]
		let paramIndex = 2

		let queryString = `
			SELECT t.*, 
				json_build_object('id', u1.id, 'name', u1.name, 'email', u1.email, 'avatar', u1.avatar) as assignee,
				json_build_object('id', u2.id, 'name', u2.name, 'email', u2.email, 'avatar', u2.avatar) as reviewer,
				json_build_object('id', p.id, 'name', p.name) as project
			FROM tasks t
			INNER JOIN projects p ON t."projectId" = p.id
			LEFT JOIN users u1 ON t."assigneeId" = u1.id
			LEFT JOIN users u2 ON t."reviewerId" = u2.id
			WHERE p."teamId" = $1
		`

		if (assigneeId) {
			queryString += ` AND t."assigneeId" = $${paramIndex}`
			params.push(assigneeId)
			paramIndex++
		}

		if (qcId) {
			queryString += ` AND t."reviewerId" = $${paramIndex}`
			params.push(qcId)
			paramIndex++
		}

		if (status) {
			queryString += ` AND t.status = $${paramIndex}`
			params.push(status)
			paramIndex++
		}

		if (priority) {
			queryString += ` AND t.priority = $${paramIndex}`
			params.push(priority)
			paramIndex++
		}

		if (projectId) {
			queryString += ` AND t."projectId" = $${paramIndex}`
			params.push(projectId)
			paramIndex++
		}

		if (dueDate !== undefined) {
			const start = dayjs.unix(Number(dueDate)).startOf('day').unix()
			const end = dayjs.unix(Number(dueDate)).endOf('day').unix()
			queryString += ` AND t."dueDate" BETWEEN $${paramIndex} AND $${paramIndex + 1}`
			params.push(start, end)
			paramIndex += 2
		}

		queryString += `
			ORDER BY t."created_at" DESC
			LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
		`
		params.push(_limit, _skip)

		const tasks = await AppDataSource.query(queryString, params)

		// Get total count
		let countQuery = `
			SELECT COUNT(t.id) as total
			FROM tasks t
			INNER JOIN projects p ON t."projectId" = p.id
			WHERE p."teamId" = $1
		`
		const countParams: any[] = [teamId]
		let countParamIndex = 2

		if (assigneeId) {
			countQuery += ` AND t."assigneeId" = $${countParamIndex}`
			countParams.push(assigneeId)
			countParamIndex++
		}

		if (qcId) {
			countQuery += ` AND t."reviewerId" = $${countParamIndex}`
			countParams.push(qcId)
			countParamIndex++
		}

		if (status) {
			countQuery += ` AND t.status = $${countParamIndex}`
			countParams.push(status)
			countParamIndex++
		}

		if (priority) {
			countQuery += ` AND t.priority = $${countParamIndex}`
			countParams.push(priority)
			countParamIndex++
		}

		if (projectId) {
			countQuery += ` AND t."projectId" = $${countParamIndex}`
			countParams.push(projectId)
			countParamIndex++
		}

		if (dueDate !== undefined) {
			const start = dayjs.unix(Number(dueDate)).startOf('day').unix()
			const end = dayjs.unix(Number(dueDate)).endOf('day').unix()
			countQuery += ` AND t."dueDate" BETWEEN $${countParamIndex} AND $${countParamIndex + 1}`
			countParams.push(start, end)
			countParamIndex += 2
		}

		const [{ total }] = await AppDataSource.query(countQuery, countParams)

		const currentPage = Math.floor(_skip / _limit) + 1
		const pages = Math.max(1, Math.ceil(Number(total) / _limit))

		return { tasks, page: { total: Number(total), currentPage, pages } }
	}

	const findTasksForPerformanceReview = async (
		userId: number,
		teamId: number,
		fromAt: number,
		toAt: number
	): Promise<PerformanceReviewTaskRow[]> => {
		const tasks = await AppDataSource.query(
			`
				SELECT
					t.id,
					t.title,
					t.description,
					t.priority,
					t.status,
					t."estimateEffort" AS "estimateEffort",
					t."actualEffort" AS "actualEffort",
					t."startDate" AS "startDate",
					t."dueDate" AS "dueDate",
					t."completedAt" AS "completedAt",
					COALESCE(
						json_agg(
							json_build_object(
								'id', tc.id,
								'authorId', tc."authorId",
								'authorName', u.name,
								'content', tc.content,
								'createdAt', tc."createdAt"
							)
						) FILTER (WHERE tc.id IS NOT NULL AND tc.content IS NOT NULL AND btrim(tc.content) <> ''),
						'[]'::json
					) AS comments
				FROM tasks t
				INNER JOIN projects p ON p.id = t."projectId"
				LEFT JOIN task_comments tc ON tc."taskId" = t.id
				LEFT JOIN users u ON u.id = tc."authorId"
				WHERE p."teamId" = $1
					AND t."assigneeId" = $2
					AND (
						(t."startDate" IS NOT NULL AND t."startDate" BETWEEN $3 AND $4)
						OR (t."dueDate" IS NOT NULL AND t."dueDate" BETWEEN $3 AND $4)
						OR (t."completedAt" IS NOT NULL AND t."completedAt" BETWEEN $3 AND $4)
						OR (t."startDate" IS NOT NULL AND t."dueDate" IS NOT NULL AND t."startDate" <= $4 AND t."dueDate" >= $3)
					)
				GROUP BY t.id
				ORDER BY COALESCE(t."completedAt", t."dueDate", t."startDate") ASC NULLS LAST, t."created_at" ASC
			`,
			[teamId, userId, fromAt, toAt]
		)

		return tasks as PerformanceReviewTaskRow[]
	}

	const findTeamPerformanceDashboard = async (
		teamId: number,
		fromAt: number,
		toAt: number
	): Promise<TeamPerformanceDashboardRow[]> => {
		const rows = await AppDataSource.query(
			`
				SELECT
					u.id AS "userId",
					u.name,
					u.email,
					u.avatar,
					u.position,
					COALESCE(
						(
							SELECT array_agg(us."skillName" ORDER BY us."skillName")
							FROM user_skills us
							WHERE us."userId" = u.id
						),
						ARRAY[]::varchar[]
					) AS skills,
					u."yearOfExperience" AS "yearOfExperience",
					COUNT(t.id) AS "totalTasks",
					COUNT(t.id) FILTER (
						WHERE t.status = '${TaskStatus.Done}' OR t."completedAt" IS NOT NULL
					) AS "completedTasks",
					COUNT(t.id) FILTER (
						WHERE (t.status = '${TaskStatus.Done}' OR t."completedAt" IS NOT NULL)
						AND t."completedAt" IS NOT NULL
						AND t."dueDate" IS NOT NULL
						AND t."completedAt" <= t."dueDate"
					) AS "onTimeCompletedTasks",
					COALESCE(SUM(t."estimateEffort"), 0) AS "totalStoryPoints",
					COALESCE(
						SUM(t."estimateEffort") FILTER (
							WHERE t.status = '${TaskStatus.Done}' OR t."completedAt" IS NOT NULL
						),
						0
					) AS "storyPointsAchieved"
				FROM team_members tm
				INNER JOIN users u ON u.id = tm."userId"
				LEFT JOIN tasks t ON t."assigneeId" = u.id
				LEFT JOIN projects p ON p.id = t."projectId" AND p."teamId" = $1
				WHERE tm."teamId" = $1
					AND tm."isActive" = true
					AND (
						t.id IS NULL
						OR (
							p.id IS NOT NULL
							AND (
								(t."startDate" IS NOT NULL AND t."startDate" BETWEEN $2 AND $3)
								OR (t."dueDate" IS NOT NULL AND t."dueDate" BETWEEN $2 AND $3)
								OR (t."completedAt" IS NOT NULL AND t."completedAt" BETWEEN $2 AND $3)
								OR (t."startDate" IS NOT NULL AND t."dueDate" IS NOT NULL AND t."startDate" <= $3 AND t."dueDate" >= $2)
							)
						)
					)
				GROUP BY u.id
				ORDER BY u.name ASC, u.id ASC
			`,
			[teamId, fromAt, toAt]
		)

		return rows as TeamPerformanceDashboardRow[]
	}

	return {
		findAll,
		findOne,
		create,
		update,
		remove,
		findAllByQueryBuilder,
		findAllByRawQuery,
		findTasksForPerformanceReview,
		findTeamPerformanceDashboard
	}
}
