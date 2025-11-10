import { AppDataSource } from '~/db/data-source.js'
import { Project } from '~/model/project.entity.js'

export const getProjectRepository = () => {
	const repo = AppDataSource.getRepository(Project)

	const findOneById = async (id: number): Promise<Project | null> => {
		return await repo.findOneBy({ id })
	}

	const findAll = async (): Promise<Project[]> => {
		return await repo.find()
	}

	const create = async (data: Partial<Project>): Promise<Project> => {
		const project = repo.create(data)
		return await repo.save(project)
	}

	const update = async (id: number, data: Partial<Project>): Promise<Project | null> => {
		const project = await repo.findOneBy({ id })
		if (!project) {
			return null
		}
		Object.assign(project, data)
		return await repo.save(project)
	}

	return {
		findOneById,
		findAll,
		create,
		update
	}
}
