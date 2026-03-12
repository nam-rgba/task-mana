import { AppDataSource } from '~/db/data-source.js'
import { ApiKey } from '~/model/api-key.entity.js'

export const getApiKeyRepository = () => {
	const repo = AppDataSource.getRepository(ApiKey)

	const create = async (data: Partial<ApiKey>): Promise<ApiKey> => {
		const apiKey = repo.create(data)
		return await repo.save(apiKey)
	}

	const findByIdAndUserId = async (id: number, userId: number) => {
		return await repo.findOne({ where: { id, userId } })
	}

	const findByUserIdWithUsage = async (userId: number) => {
		return await repo
			.createQueryBuilder('apiKey')
			.leftJoin('apiKey.usages', 'usage')
			.where('apiKey.userId = :userId', { userId })
			.select([
				'apiKey.id AS id',
				'apiKey.name AS name',
				'apiKey.provider AS provider',
				'apiKey.modelname as modelname',
				'apiKey.isActive AS "isActive"',
				'apiKey.userId AS "userId"',
				'apiKey.createdAt AS "createdAt"',
				'COALESCE(SUM(usage."totalTokens"), 0) AS "totalTokensUsed"'
			])
			.groupBy('apiKey.id')
			.orderBy('apiKey.createdAt', 'DESC')
			.getRawMany()
	}

	const save = async (apiKey: ApiKey) => {
		return await repo.save(apiKey)
	}

	const remove = async (apiKey: ApiKey) => {
		await repo.remove(apiKey)
	}

	return {
		create,
		findByIdAndUserId,
		findByUserIdWithUsage,
		save,
		remove
	}
}
