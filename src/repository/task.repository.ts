// src/repository/task.repository.ts
import { AppDataSource } from '~/db/data-source.js'
import { Task } from '~/model/Task.js'
import { ILike } from 'typeorm'

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
	const { q, title, completed } = query
	const filter: any = {}

	if (q) {
		filter.where = [{ title: ILike(`%${q}%`) }]
	}

	if (title) {
		filter.where = { ...(filter.where || {}), title: ILike(`%${title}%`) }
	}

	if (completed !== undefined) {
		filter.where = { ...(filter.where || {}), completed }
	}

	return filter
}

export const getTaskRepository = () => {
	const repo = AppDataSource.getRepository(Task)

	const findAll = async ({
		page = 1,
		limit = 10,
		skip,
		query,
		sort = 'createdAt'
	}: {
		page?: number
		limit?: number
		skip?: number
		query?: QueryFilter
		sort?: string
	}) => {
		const { skip: _skip, limit: _limit } = normalizePaging({ page, limit, skip })
		const filter = buildFilter(query)

		const [tasks, total] = await repo.findAndCount({
			where: filter.where,
			skip: _skip,
			take: _limit,
			order: {
				[sort.replace('-', '')]: sort.startsWith('-') ? 'DESC' : 'ASC'
			}
		})

		const currentPage = Math.floor(_skip / _limit) + 1
		const pages = Math.max(1, Math.ceil(total / _limit))

		return { tasks, metadata: { total, currentPage, pages } }
	}

	const findOne = async (id: string): Promise<Task | null> => {
		return await repo.findOneBy({ id })
	}

	const create = async (data: Partial<Task>): Promise<Task> => {
		const task = repo.create(data)
		return await repo.save(task)
	}

	const update = async (id: string, data: Partial<Task>): Promise<Task | null> => {
		const task = await repo.findOneBy({ id })
		if (!task) return null
		const updated = repo.merge(task, data)
		return await repo.save(updated)
	}

	const remove = async (id: string): Promise<boolean> => {
		const result = await repo.delete(id)
		return !!result.affected && result.affected > 0
	}

	return { findAll, findOne, create, update, remove }
}
