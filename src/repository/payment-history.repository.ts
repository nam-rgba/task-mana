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

	const findByUserId = async (userId: number): Promise<PaymentHistory[]> => {
		return await repo.find({
			where: { userId },
			order: { createdAt: 'DESC' }
		})
	}

	return {
		create,
		findByOrderId,
		findByUserId
	}
}
