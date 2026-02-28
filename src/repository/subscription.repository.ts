import { AppDataSource } from '~/db/data-source.js'
import { Subscription } from '~/model/subscription.entity.js'
import { SubscriptionStatus } from '~/model/enums/billing.enum.js'

export const getSubscriptionRepository = () => {
	const repo = AppDataSource.getRepository(Subscription)

	const findActiveByUserId = async (userId: number): Promise<Subscription | null> => {
		return await repo.findOne({
			where: { userId, status: SubscriptionStatus.ACTIVE },
			relations: ['plan'],
			order: { createdAt: 'DESC' }
		})
	}

	const findByUserId = async (userId: number): Promise<Subscription[]> => {
		return await repo.find({
			where: { userId },
			relations: ['plan'],
			order: { createdAt: 'DESC' }
		})
	}

	const create = async (data: Partial<Subscription>): Promise<Subscription> => {
		const subscription = repo.create(data)
		return await repo.save(subscription)
	}

	const update = async (id: number, data: Partial<Subscription>): Promise<Subscription | null> => {
		const subscription = await repo.findOneBy({ id })
		if (!subscription) return null
		Object.assign(subscription, data)
		return await repo.save(subscription)
	}

	const deactivateByUserId = async (userId: number): Promise<void> => {
		await repo.update({ userId, status: SubscriptionStatus.ACTIVE }, { status: SubscriptionStatus.EXPIRED })
	}

	return {
		findActiveByUserId,
		findByUserId,
		create,
		update,
		deactivateByUserId
	}
}
