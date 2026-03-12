import { User } from '~/model/user.entity.js'
import { getUserRepository } from '~/repository/user.repository.js'
import { getSubscriptionRepository } from '~/repository/subscription.repository.js'
import { getSkillRepository } from '~/repository/skill.repository.js'
import { BadRequestError } from '~/utils/error.reponse.js'

const userRepo = getUserRepository()
const subscriptionRepo = getSubscriptionRepository()

const sanitizeSkills = (skills: unknown): string[] => {
	if (!Array.isArray(skills)) {
		throw new BadRequestError('skills must be an array of strings')
	}

	if (skills.length > 20) {
		throw new BadRequestError('skills can contain at most 20 items')
	}

	const dedupedByNormalized = new Map<string, string>()

	skills.forEach((skill, index) => {
		if (typeof skill !== 'string') {
			throw new BadRequestError(`skills[${index}] must be a string`)
		}

		const normalized = skill.trim()
		if (!normalized) {
			throw new BadRequestError(`skills[${index}] must not be empty`)
		}

		if (normalized.length > 20) {
			throw new BadRequestError(`skills[${index}] must be at most 20 characters`)
		}

		dedupedByNormalized.set(normalized.toLowerCase(), normalized)
	})

	return Array.from(dedupedByNormalized.values())
}

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

export const updateUser = async (id: number, data: Partial<User>): Promise<(User & { skills: string[] }) | null> => {
	const skillRepo = getSkillRepository()
	let skills: string[] = []

	if (data.skills !== undefined) {
		skills = sanitizeSkills(data.skills)
		// Sync skills to join table
		await skillRepo.syncUserSkills(id, skills)
		// Remove skills from data object since it's not a column anymore
		const { skills: _, ...dataWithoutSkills } = data as any
		data = dataWithoutSkills
	}

	const updated = await userRepo.update(id, data)

	// Load skills from relation table back into response
	if (updated) {
		if (skills.length === 0) {
			skills = await skillRepo.getUserSkills(updated.id)
		}
		return { ...updated, skills }
	}

	return null
}

export const getAllUsers = async ({ page = 1, limit = 10, query }: IGetAllUsersOptions) => {
	return await userRepo.findAll({
		page,
		limit,
		query
	})
}
