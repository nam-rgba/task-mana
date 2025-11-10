import { AppDataSource } from '~/db/data-source.js'
import { TeamMember } from '~/model/teamMember.entity.js'

export const getTeamMemberRepository = () => {
	const repo = AppDataSource.getRepository(TeamMember)

	const findOneById = async (id: number): Promise<TeamMember | null> => {
		return await repo.findOneBy({ id })
	}

	const findAll = async (): Promise<TeamMember[]> => {
		return await repo.find()
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

	return {
		findOneById,
		findAll,
		create,
		update
	}
}
