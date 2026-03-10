import { AppDataSource } from '~/db/data-source.js'
import { Milestone } from '~/model/milestone.entity.js'

export const getMilestoneRepository = () => {
	const repo = AppDataSource.getRepository(Milestone)

	const findOneById = async (id: number): Promise<Milestone | null> => {
		return await repo.findOneBy({ id })
	}

	const findByProject = async (projectId: number): Promise<Milestone[]> => {
		return await repo.find({
			where: { projectId },
			order: { sortOrder: 'ASC' }
		})
	}

	const create = async (data: Partial<Milestone>): Promise<Milestone> => {
		const milestone = repo.create(data)
		return await repo.save(milestone)
	}

	const update = async (id: number, data: Partial<Milestone>): Promise<Milestone | null> => {
		const milestone = await repo.findOneBy({ id })
		if (!milestone) return null
		Object.assign(milestone, data)
		return await repo.save(milestone)
	}

	const remove = async (id: number): Promise<boolean> => {
		const result = await repo.softDelete(id)
		return !!(result.affected && result.affected > 0)
	}

	return {
		findOneById,
		findByProject,
		create,
		update,
		remove
	}
}
