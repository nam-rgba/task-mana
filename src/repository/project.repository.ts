import { AppDataSource } from '~/db/data-source.js'
import { Project } from '~/model/project.entity.js'

export const getProjectRepository = () => {
	const repo = AppDataSource.getRepository(Project)

	const findOneById = async (id: number): Promise<Project | null> => {
		return await repo.findOneBy({ id })
	}

	const findOneWithSchedules = async (id: number): Promise<Project | null> => {
		return await repo.findOne({
			where: { id },
			relations: ['team', 'lead', 'schedules'],
			order: { schedules: { sortOrder: 'ASC' } }
		})
	}

	const getAllNameAndId = async (): Promise<{ id: number; name: string }[]> => {
		const projects = await repo.find({
			select: ['id', 'name']
		})
		return projects.map((project) => ({ id: project.id, name: project.name }))
	}

	const findAll = async ({
		page,
		limit,
		query
	}: {
		page?: number
		limit?: number
		query?: { [key: string]: any }
	}): Promise<Project[]> => {
		return await repo.find({
			where: query,
			skip: page && limit ? (page - 1) * limit : undefined,
			take: limit
		})
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

	const deleteProject = async (id: number): Promise<boolean> => {
		const result = await repo.delete(id)
		return !!(result.affected && result.affected > 0)
	}

	return {
		findOneById,
		findOneWithSchedules,
		findAll,
		create,
		update,
		deleteProject,
		getAllNameAndId
	}
}
