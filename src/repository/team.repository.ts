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

	const findAll = async ({ userId }: { userId: number }): Promise<Team[]> => {
		const teams = await repo
			.createQueryBuilder('team')
			.leftJoinAndSelect('team.members', 'tm')
			.leftJoinAndSelect('team.lead', 'lead')
			.where('tm.userId = :userId', { userId })
			.getMany()
		return teams
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

	type getTeamDetailOptions = {
		id: number
	}

	const findDetailTeam = async ({ id }: getTeamDetailOptions) => {
		const team = await repo
			.createQueryBuilder('team')
			.leftJoinAndSelect('team.projects', 'projects')
			.leftJoinAndSelect('team.members', 'tm')
			.leftJoinAndSelect('tm.user', 'user')
			.leftJoinAndSelect('team.lead', 'lead')
			.where('team.id = :id', { id })
			.getOne()
		return team
	}

	const save = async (team: Team) => {
		return repo.save(team)
	}

	return {
		findOneById,
		findOneByKey,
		findAll,
		create,
		update,
		findDetailTeam,
		save
	}
}
