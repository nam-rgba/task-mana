import { AppDataSource } from '~/db/data-source.js'
import { Plan } from '~/model/plan.entity.js'

export const getPlanRepository = () => {
	const repo = AppDataSource.getRepository(Plan)

	const findAll = async (): Promise<Plan[]> => {
		return await repo.find({
			where: { isActive: true },
			order: { monthlyPrice: 'ASC' }
		})
	}

	const findOneById = async (id: number): Promise<Plan | null> => {
		return await repo.findOneBy({ id })
	}

	const findOneByName = async (name: string): Promise<Plan | null> => {
		return await repo.findOneBy({ name: name as any })
	}

	const create = async (data: Partial<Plan>): Promise<Plan> => {
		const plan = repo.create(data)
		return await repo.save(plan)
	}

	const update = async (id: number, data: Partial<Plan>): Promise<Plan | null> => {
		const plan = await repo.findOneBy({ id })
		if (!plan) return null
		Object.assign(plan, data)
		return await repo.save(plan)
	}

	return {
		findAll,
		findOneById,
		findOneByName,
		create,
		update
	}
}
