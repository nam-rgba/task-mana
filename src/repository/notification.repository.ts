import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '~/constants/default-query.js'
import { AppDataSource } from '~/db/data-source.js'
import { Notification } from '~/model/notification.entity.js'

interface PagingInput {
	page?: number
	limit?: number
	skip?: number
}

const normalizePaging = ({ page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, skip }: PagingInput) => {
	let normalizedLimit = Number(limit) || DEFAULT_LIMIT
	if (normalizedLimit > MAX_LIMIT) normalizedLimit = MAX_LIMIT
	if (normalizedLimit < 1) normalizedLimit = DEFAULT_LIMIT

	let normalizedSkip = Number(skip)
	if (Number.isNaN(normalizedSkip) || normalizedSkip < 0) {
		const normalizedPage = Number(page) || DEFAULT_PAGE
		normalizedSkip = (normalizedPage - 1) * normalizedLimit
	}

	return {
		limit: normalizedLimit,
		skip: normalizedSkip
	}
}

export const getNotificationRepository = () => {
	const repo = AppDataSource.getRepository(Notification)

	const create = async (data: Partial<Notification>): Promise<Notification> => {
		const notification = repo.create(data)
		return await repo.save(notification)
	}

	const findByUser = async (userId: number, paging: PagingInput = {}) => {
		const { limit, skip } = normalizePaging(paging)

		const [notifications, total] = await repo.findAndCount({
			where: { userId },
			order: { createdAt: 'DESC' },
			take: limit,
			skip
		})

		const currentPage = Math.floor(skip / limit) + 1
		const pages = Math.max(1, Math.ceil(total / limit))

		return {
			notifications,
			page: {
				total,
				currentPage,
				pages
			}
		}
	}

	const findOneByIdAndUser = async (id: number, userId: number): Promise<Notification | null> => {
		return await repo.findOne({ where: { id, userId } })
	}

	const update = async (id: number, data: Partial<Notification>): Promise<Notification | null> => {
		const found = await repo.findOneBy({ id })
		if (!found) return null

		const merged = repo.merge(found, data)
		return await repo.save(merged)
	}

	return {
		create,
		findByUser,
		findOneByIdAndUser,
		update
	}
}
