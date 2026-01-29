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

		const [tasks, total] = await repo.findAndCount({
			where: filter.where,
			skip: _skip,
			take: _limit,
			order: {
				createdAt: 'DESC'
			},
			relations: ['assignee', 'reviewer', 'project']
		})

		const currentPage = Math.floor(_skip / _limit) + 1
		const pages = Math.max(1, Math.ceil(total / _limit))

		return { tasks, page: { total, currentPage, pages } }
	}

	const findOne = async (id: number): Promise<Task | null> => {
		return await repo.findOneBy({ id })
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
			.leftJoinAndSelect('task.assignee', 'assignee')
			.leftJoinAndSelect('task.reviewer', 'reviewer')
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
		const { page = 1, limit = 10, teamId, assigneeId, qcId, status, priority, projectId } = query
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

		const [{ total }] = await AppDataSource.query(countQuery, countParams)

		const currentPage = Math.floor(_skip / _limit) + 1
		const pages = Math.max(1, Math.ceil(Number(total) / _limit))

		return { tasks, page: { total: Number(total), currentPage, pages } }
	}

	return { findAll, findOne, create, update, remove, findAllByQueryBuilder, findAllByRawQuery }
}
