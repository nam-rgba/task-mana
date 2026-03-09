import { User } from '~/model/user.entity.js'
import { getUserRepository } from '~/repository/user.repository.js'
import { getSubscriptionRepository } from '~/repository/subscription.repository.js'

const userRepo = getUserRepository()
const subscriptionRepo = getSubscriptionRepository()

export interface IGetAllUsersOptions {
	page?: number
	limit?: number
	skip?: number
	query?: Record<string, any>
}
const { findOne, create } = userRepo

export const getUserByEmail = async (email: string) => {
	return await findOne({ email }, 'AUTH')
}

export const checkRegistedEmail = async (email: string): Promise<boolean> => {
	return await userRepo.checkRegistedEmail(email)
}

export const getUserById = async (id: number) => {
	const user = await findOne({ id })
	const subscription = await subscriptionRepo.findActiveByUserId(id)

	return {
		...user,
		subscription: subscription
			? {
					id: subscription.id,
					planId: subscription.planId,
					billingCycle: subscription.billingCycle,
					startDate: subscription.startDate,
					endDate: subscription.endDate,
					status: subscription.status,
					plan: subscription.plan
						? {
								id: subscription.plan.id,
								name: subscription.plan.name,
								displayName: subscription.plan.displayName,
								features: subscription.plan.features
							}
						: null
				}
			: null
	}
}

export const createUser = async (data: {
	email: string
	password?: string | null
	name: string
	[key: string]: any
}): Promise<User> => {
	return await create({
		...data
	})
}

export const updateUser = async (id: number, data: Partial<User>): Promise<User | null> => {
	return await userRepo.update(id, data)
}

export const getAllUsers = async ({ page = 1, limit = 10, query }: IGetAllUsersOptions) => {
	return await userRepo.findAll({
		page,
		limit,
		query
	})
}
