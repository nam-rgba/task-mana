import { AppDataSource } from '~/db/data-source.js'
import { TeamMember } from '~/model/teamMember.entity.js'

export const getTeamMemberRepository = () => {
	const repo = AppDataSource.getRepository(TeamMember)

	const findOneById = async (id: number): Promise<TeamMember | null> => {
		return await repo.findOneBy({ id })
	}

	const findAll = async ({
		page,
		limit,
		query
	}: {
		page?: number
		limit?: number
		query?: { [key: string]: any }
	}): Promise<TeamMember[]> => {
		return await repo.find({
			where: query,
			skip: page && limit ? (page - 1) * limit : undefined,
			take: limit
		})
	}

	const create = async (data: Partial<TeamMember>): Promise<TeamMember> => {
		const teamMember = repo.create(data)
		return await repo.save(teamMember)
	}

	const update = async (id: number, data: Partial<TeamMember>): Promise<TeamMember | null> => {
		const teamMember = await repo.findOneBy({ id })
		if (!teamMember) {
			return null
		}
		Object.assign(teamMember, data)
		return await repo.save(teamMember)
	}

	const findLastByUserId = async (userId: number): Promise<TeamMember | null> => {
		return await repo.findOne({
			where: { userId },
			select: {
				teamId: true
			},
			order: { createdAt: 'DESC' }
		})
	}

	const deleteOne = async (id: number): Promise<void> => {
		const teamMember = await repo.findOneBy({ id })
		if (teamMember) {
			await repo.remove(teamMember)
		}
	}

	const findOneByUserAndTeamId = async (userId: number, teamId: number): Promise<TeamMember | null> => {
		return await repo.findOneBy({ userId, teamId })
	}

	return {
		findOneById,
		findAll,
		create,
		update,
		findLastByUserId,
		findOneByUserAndTeamId,
		deleteOne
	}
}
