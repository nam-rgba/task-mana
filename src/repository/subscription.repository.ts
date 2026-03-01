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

	/**
	 * Count active subscriptions
	 */
	const countActive = async (): Promise<number> => {
		return await repo.count({ where: { status: SubscriptionStatus.ACTIVE } })
	}

	/**
	 * Get active subscriptions by plan
	 */
	const getActiveByPlan = async (): Promise<{ planId: number; planName: string; count: number }[]> => {
		const result = await repo
			.createQueryBuilder('subscription')
			.leftJoinAndSelect('subscription.plan', 'plan')
			.select('subscription.planId', 'planId')
			.addSelect('plan.displayName', 'planName')
			.addSelect('COUNT(subscription.id)', 'count')
			.where('subscription.status = :status', { status: SubscriptionStatus.ACTIVE })
			.groupBy('subscription.planId')
			.addGroupBy('plan.displayName')
			.getRawMany()

		return result.map((row) => ({
			planId: Number(row.planId),
			planName: row.planName,
			count: Number(row.count) || 0
		}))
	}

	/**
	 * Get new subscriptions by month
	 */
	const getNewSubscriptionsByMonth = async (year: number): Promise<{ month: number; count: number }[]> => {
		const result = await repo
			.createQueryBuilder('subscription')
			.select('EXTRACT(MONTH FROM subscription.startDate)', 'month')
			.addSelect('COUNT(subscription.id)', 'count')
			.where('EXTRACT(YEAR FROM subscription.startDate) = :year', { year })
			.groupBy('EXTRACT(MONTH FROM subscription.startDate)')
			.orderBy('month', 'ASC')
			.getRawMany()

		return result.map((row) => ({
			month: Number(row.month),
			count: Number(row.count) || 0
		}))
	}

	return {
		findActiveByUserId,
		findByUserId,
		create,
		update,
		deactivateByUserId,
		countActive,
		getActiveByPlan,
		getNewSubscriptionsByMonth
	}
}
