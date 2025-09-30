import { Prisma, User } from '~/db/generated/prisma/index.js'
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '../constants/default-query.js'

const userModel = prisma.user

interface IQuery {
	page: number
	limit: number
	skip?: number
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

type QueryFilter = {
	q?: string
	email?: string
	name?: string
	[key: string]: any
}

const buildFilter = (query: QueryFilter = {}) => {
	const { q, email, name } = query
	const filter: any = {}

	if (q) {
		const rx = new RegExp(
			String(q)
				.trim()
				.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
			'i'
		)
		filter.OR = [{ name: rx }, { email: rx }]
	}
	if (email) filter.email = { equals: email }
	if (name) filter.name = new RegExp(String(name), 'i')

	return filter
}

interface FindAllOptions {
	page?: number
	limit?: number
	skip?: number
	query?: QueryFilter
	sort?: string
	select?: any
}

const findAll = async ({
	page = DEFAULT_PAGE,
	limit = DEFAULT_LIMIT,
	skip,
	query,
	sort = 'createdAt',
	select
}: FindAllOptions) => {
	const { limit: _limit, skip: _skip } = normalizePaging({ page, limit, skip })

	const filter = buildFilter(query)

	const users = await userModel.findMany({
		where: filter,
		skip: _skip,
		take: _limit,
		orderBy: {
			[sort.replace('-', '')]: sort.startsWith('-') ? 'desc' : 'asc'
		},
		select
	})

	const total = await userModel.count({ where: filter })
	const currentPage = Math.floor(_skip / _limit) + 1
	const pages = Math.max(1, Math.ceil(total / _limit))

	return {
		users,
		metadata: {
			total,
			currentPage,
			pages
		}
	}
}

const findOne = async (q: any, select?: any): Promise<User | null> => {
	return await userModel.findFirst({
		where: q,
		select
	})
}

const create = async (data: Prisma.UserCreateInput): Promise<User> => {
	const newUser = await userModel.create({
		data
	})
	return newUser
}

export { findOne, findAll, create }
