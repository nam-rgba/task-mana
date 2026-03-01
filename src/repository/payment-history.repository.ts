import { AppDataSource } from '~/db/data-source.js'
import { PaymentHistory } from '~/model/payment-history.entity.js'

export const getPaymentHistoryRepository = () => {
	const repo = AppDataSource.getRepository(PaymentHistory)

	const create = async (data: Partial<PaymentHistory>): Promise<PaymentHistory> => {
		const history = repo.create(data)
		return await repo.save(history)
	}

	const findByOrderId = async (orderId: number): Promise<PaymentHistory[]> => {
		return await repo.find({
			where: { orderId },
			order: { createdAt: 'DESC' }
		})
	}

	const findByUserId = async (
		userId: number,
		page?: number,
		limit?: number
	): Promise<{ data: PaymentHistory[]; total: number }> => {
		const [data, total] = await repo.findAndCount({
			where: { userId },
			relations: ['order', 'order.plan'],
			order: { createdAt: 'DESC' },
			skip: page && limit ? (page - 1) * limit : undefined,
			take: limit
		})
		return { data, total }
	}

	const findAll = async (page?: number, limit?: number): Promise<{ data: PaymentHistory[]; total: number }> => {
		const [data, total] = await repo.findAndCount({
			relations: ['order', 'order.plan', 'user'],
			order: { createdAt: 'DESC' },
			skip: page && limit ? (page - 1) * limit : undefined,
			take: limit
		})
		return { data, total }
	}

	return {
		create,
		findByOrderId,
		findByUserId,
		findAll
	}
}
