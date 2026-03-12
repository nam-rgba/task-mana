import { AppDataSource } from '~/db/data-source.js'
import { Usage } from '~/model/usage.entity.js'

export const getUsageRepository = () => {
	const repo = AppDataSource.getRepository(Usage)

	const create = async (data: Partial<Usage>): Promise<Usage> => {
		const usage = repo.create(data)
		return await repo.save(usage)
	}

	const findByApiKeyId = async (apiKeyId: number, { page = 1, limit = 20 }: { page?: number; limit?: number } = {}) => {
		const _limit = Math.min(Math.max(Number(limit) || 20, 1), 100)
		const _skip = (Math.max(Number(page) || 1, 1) - 1) * _limit

		const [usages, total] = await repo.findAndCount({
			where: { apiKeyId },
			order: { createdAt: 'DESC' },
			skip: _skip,
			take: _limit
		})

		const pages = Math.max(1, Math.ceil(total / _limit))
		return { usages, page: { total, currentPage: Math.floor(_skip / _limit) + 1, pages } }
	}

	const getOverviewByApiKeyId = async (apiKeyId: number) => {
		const result = await repo
			.createQueryBuilder('usage')
			.where('usage.apiKeyId = :apiKeyId', { apiKeyId })
			.select([
				'COUNT(usage.id) AS "totalRequests"',
				'COALESCE(SUM(usage."totalTokens"), 0) AS "totalTokens"',
				'COALESCE(SUM(usage."promptTokens"), 0) AS "totalPromptTokens"',
				'COALESCE(SUM(usage."completionTokens"), 0) AS "totalCompletionTokens"',
				'COALESCE(SUM(usage."reasoningTokens"), 0) AS "totalReasoningTokens"',
				'COALESCE(AVG(usage."totalTime"), 0) AS "avgTotalTime"',
				'COALESCE(AVG(usage."promptTime"), 0) AS "avgPromptTime"',
				'COALESCE(AVG(usage."completionTime"), 0) AS "avgCompletionTime"',
				'COUNT(usage.id) FILTER (WHERE usage."requestType" = \'chat\') AS "totalChatRequests"',
				'COUNT(usage.id) FILTER (WHERE usage."requestType" = \'vision\') AS "totalVisionRequests"'
			])
			.getRawOne()

		return {
			totalRequests: Number(result?.totalRequests || 0),
			totalTokens: Number(result?.totalTokens || 0),
			totalPromptTokens: Number(result?.totalPromptTokens || 0),
			totalCompletionTokens: Number(result?.totalCompletionTokens || 0),
			totalReasoningTokens: Number(result?.totalReasoningTokens || 0),
			avgTotalTime: Number(Number(result?.avgTotalTime || 0).toFixed(4)),
			avgPromptTime: Number(Number(result?.avgPromptTime || 0).toFixed(4)),
			avgCompletionTime: Number(Number(result?.avgCompletionTime || 0).toFixed(4)),
			totalChatRequests: Number(result?.totalChatRequests || 0),
			totalVisionRequests: Number(result?.totalVisionRequests || 0)
		}
	}

	return {
		create,
		findByApiKeyId,
		getOverviewByApiKeyId
	}
}
