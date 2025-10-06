// user.repository.ts
import { ILike } from 'typeorm'
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '~/constants/default-query.js'
import { AppDataSource } from '~/db/data-source.js'
import { User } from '~/model/User.js'

interface IQuery {
	page: number
	limit: number
	skip?: number
}

type QueryFilter = {
	q?: string
	email?: string
	name?: string
	[key: string]: any
}

const normalizePaging = ({ page, limit, skip }: IQuery) => {
	let _limit = Number(limit) || DEFAULT_LIMIT
	if (_limit > MAX_LIMIT) _limit = MAX_LIMIT
	if (_limit < 1) _limit = DEFAULT_LIMIT

	let _skip = Number(skip)
	if (Number.isNaN(_skip) || _skip < 0) {
		const _page = Number(page) || DEFAULT_PAGE
		_skip = (_page - 1) * _limit
	}
	return { skip: _skip, limit: _limit, page }
}

const buildFilter = (query: QueryFilter = {}) => {
	const { q, email, name } = query
	const filter: any = {}

	if (q) {
		filter.where = [{ name: ILike(`%${q}%`) }, { email: ILike(`%${q}%`) }]
	}

	if (email) {
		filter.where = { ...(filter.where || {}), email }
	}

	if (name) {
		filter.where = { ...(filter.where || {}), name: ILike(`%${name}%`) }
	}

	return filter
}

export const getUserRepository = () => {
	const repo = AppDataSource.getRepository(User)

	const findAll = async ({
		page = DEFAULT_PAGE,
		limit = DEFAULT_LIMIT,
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
		const { limit: _limit, skip: _skip } = normalizePaging({ page, limit, skip })
		const filter = buildFilter(query)

		const [users, total] = await repo.findAndCount({
			where: filter.where,
			skip: _skip,
			take: _limit,
			order: {
				[sort.replace('-', '')]: sort.startsWith('-') ? 'DESC' : 'ASC'
			}
		})

		const currentPage = Math.floor(_skip / _limit) + 1
		const pages = Math.max(1, Math.ceil(total / _limit))

		return {
			users,
			metadata: { total, currentPage, pages }
		}
	}

	const findOne = async (query: Partial<User>): Promise<User | null> => {
		console.log('AppDataSource initialized:', AppDataSource.isInitialized)
		return repo.findOneBy(query)
	}

	const create = async (data: Partial<User>): Promise<User> => {
		const newUser = repo.create(data)
		return await repo.save(newUser)
	}

	return {
		findAll,
		findOne,
		create
	}
}
