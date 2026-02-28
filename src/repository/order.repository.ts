import { AppDataSource } from '~/db/data-source.js'
import { Order } from '~/model/order.entity.js'

export const getOrderRepository = () => {
	const repo = AppDataSource.getRepository(Order)

	const findOneById = async (id: number): Promise<Order | null> => {
		return await repo.findOne({
			where: { id },
			relations: ['plan', 'user']
		})
	}

	const findOneByOrderCode = async (orderCode: string): Promise<Order | null> => {
		return await repo.findOne({
			where: { orderCode },
			relations: ['plan', 'user']
		})
	}

	const findOneByVnpTxnRef = async (vnpTxnRef: string): Promise<Order | null> => {
		return await repo.findOne({
			where: { vnpTxnRef },
			relations: ['plan']
		})
	}

	const findByUserId = async (userId: number, page?: number, limit?: number): Promise<Order[]> => {
		return await repo.find({
			where: { userId },
			relations: ['plan'],
			order: { createdAt: 'DESC' },
			skip: page && limit ? (page - 1) * limit : undefined,
			take: limit
		})
	}

	const create = async (data: Partial<Order>): Promise<Order> => {
		const order = repo.create(data)
		return await repo.save(order)
	}

	const update = async (id: number, data: Partial<Order>): Promise<Order | null> => {
		const order = await repo.findOneBy({ id })
		if (!order) return null
		Object.assign(order, data)
		return await repo.save(order)
	}

	return {
		findOneById,
		findOneByOrderCode,
		findOneByVnpTxnRef,
		findByUserId,
		create,
		update
	}
}
