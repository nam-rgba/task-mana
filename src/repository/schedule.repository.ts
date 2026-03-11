import { In } from 'typeorm'
import { AppDataSource } from '~/db/data-source.js'
import { Schedule } from '~/model/schedule.entity.js'

export const getScheduleRepository = () => {
	const repo = AppDataSource.getRepository(Schedule)

	const findOneById = async (id: number): Promise<Schedule | null> => {
		return await repo.findOneBy({ id })
	}

	const findOneWithTasks = async (id: number): Promise<Schedule | null> => {
		return await repo.findOne({
			where: { id },
			relations: ['tasks', 'tasks.assignee']
		})
	}

	const findByProject = async (projectId: number): Promise<Schedule[]> => {
		return await repo.find({
			where: { projectId },
			order: { sortOrder: 'ASC' }
		})
	}

	const create = async (data: Partial<Schedule>): Promise<Schedule> => {
		const schedule = repo.create(data)
		return await repo.save(schedule)
	}

	const update = async (id: number, data: Partial<Schedule>): Promise<Schedule | null> => {
		const schedule = await repo.findOneBy({ id })
		if (!schedule) return null
		Object.assign(schedule, data)
		return await repo.save(schedule)
	}

	const remove = async (id: number): Promise<boolean> => {
		const result = await repo.softDelete(id)
		return !!(result.affected && result.affected > 0)
	}

	const bulkUpdateSortOrder = async (orders: { id: number; sortOrder: number }[]): Promise<void> => {
		await Promise.all(orders.map((o) => repo.update(o.id, { sortOrder: o.sortOrder })))
	}

	const getMaxSortOrder = async (projectId: number): Promise<number> => {
		const result = await repo
			.createQueryBuilder('schedule')
			.select('MAX(schedule.sortOrder)', 'max')
			.where('schedule.projectId = :projectId', { projectId })
			.getRawOne()
		return result?.max ?? -1
	}

	return {
		findOneById,
		findOneWithTasks,
		findByProject,
		create,
		update,
		remove,
		bulkUpdateSortOrder,
		getMaxSortOrder
	}
}
