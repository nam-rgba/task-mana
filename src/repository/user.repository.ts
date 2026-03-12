// user.repository.ts
import { ILike } from 'typeorm'
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '~/constants/default-query.js'
import { AppDataSource } from '~/db/data-source.js'
import { User } from '~/model/user.entity.js'
import { BadRequestError, NotFoundError } from '~/utils/error.reponse.js'
import { getTeamMemberRepository } from './team-member.repository.js'
import { getSkillRepository } from './skill.repository.js'

export interface IQuery {
	page: number
	limit: number
	skip?: number
}

export type QueryFilter = {
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
	const { q, email, name, teamId } = query

	console.log('Building filter with query:', query) // Log the incoming query parameters
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

	if (teamId) {
		filter.where = { ...(filter.where || {}), teamMemberships: { teamId: Number(teamId) } }
	}

	return filter
}

export const getUserRepository = () => {
	const repo = AppDataSource.getRepository(User)
	const teamMemberRepo = getTeamMemberRepository()

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
			total,
			currentPage,
			pages
		}
	}

	const findOne = async (query: Partial<User>, type?: string) => {
		console.log('called with query', query)
		const { id, email } = query
		const user = await repo.findOne({
			where: { ...(id ? { id } : {}), ...(email ? { email } : {}) },
			select: {
				id: true,
				email: true,
				name: true,
				avatar: true,
				position: true,
				yearOfExperience: true,
				discordUserId: true,
				isEmailVerified: true,
				password: type === 'AUTH' ? true : false
			}
		})

		const lastTeam = await teamMemberRepo.findLastByUserId(user?.id || 0)

		// Load skills from relation table
		const skills = user?.id ? await getSkillRepository().getUserSkills(user.id) : []

		return { ...user, skills, lastTeamId: lastTeam?.teamId }
	}

	const create = async (data: Partial<User>): Promise<User> => {
		const newUser = repo.create(data)
		return await repo.save(newUser)
	}

	const update = async (id: number, data: Partial<User>): Promise<User | null> => {
		const foundUser = await repo.findOneBy({ id })
		if (!foundUser) {
			throw new NotFoundError('Not found user') // User not found
		}

		const filteredData = Object.fromEntries(Object.entries(data).filter(([_, value]) => value !== undefined))

		Object.assign(foundUser, filteredData)

		const updatedUser = await repo.save(foundUser)
		return updatedUser
	}

	const checkRegistedEmail = async (email: string): Promise<boolean> => {
		const existingUser = await repo.findOneBy({ email })
		return !!existingUser
	}

	return {
		findAll,
		findOne,
		create,
		update,
		checkRegistedEmail
	}
}
