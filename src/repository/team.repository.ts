import { AppDataSource } from '~/db/data-source.js'
import { Team } from '~/model/team.entity.js'

export const getTeamRepository = () => {
	const repo = AppDataSource.getRepository(Team)

	const findOneById = async (id: number): Promise<Team | null> => {
		return await repo.findOneBy({ id })
	}

	const findOneByKey = async (key: string): Promise<Team | null> => {
		return await repo.findOneBy({ key })
	}

	const findAll = async (): Promise<Team[]> => {
		return await repo.find()
	}

	const create = async (data: Partial<Team>): Promise<Team> => {
		const team = repo.create(data)
		return await repo.save(team)
	}

	const update = async (id: number, data: Partial<Team>): Promise<Team | null> => {
		const team = await repo.findOneBy({ id })
		if (!team) {
			return null
		}
		Object.assign(team, data)
		return await repo.save(team)
	}

	return {
		findOneById,
		findOneByKey,
		findAll,
		create,
		update
	}
}
