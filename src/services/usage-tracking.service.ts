import { getUsageRepository } from '~/repository/usage.repository.js'

type RequestType = 'chat' | 'vision'

export enum RequestScope {
	SCHEDULED = 'scheduled',
	TASK4SCHEDULED = 'task-scheduled',
	TASK = 'task',
	STORYPOINT = 'storypoint',
	ASSIGN = 'assign',
	PERFORMANCE = 'performance'
}

function toNullableNumber(value: unknown): number | null {
	if (value === null || value === undefined) return null
	const parsed = Number(value)
	return Number.isNaN(parsed) ? null : parsed
}

class UsageTrackingService {
	private get usageRepo() {
		return getUsageRepository()
	}

	async trackFromGroqResponse(params: {
		apiKeyId: number
		responseData: any
		requestType: RequestType
		requestScope: RequestScope
		metadata?: Record<string, unknown>
	}) {
		const usage = params.responseData?.usage || params.responseData?.data?.usage || params.responseData?.result?.usage
		if (!usage) return null

		const promptTokens = toNullableNumber(usage.prompt_tokens)
		const completionTokens = toNullableNumber(usage.completion_tokens)
		const totalTokens = toNullableNumber(usage.total_tokens)
		const reasoningTokens = toNullableNumber(
			usage.completion_tokens_details?.reasoning_tokens ?? usage.reasoning_tokens ?? null
		)
		const promptTime = toNullableNumber(params.responseData?.prompt_time ?? usage.prompt_time)
		const completionTime = toNullableNumber(params.responseData?.completion_time ?? usage.completion_time)
		const totalTime = toNullableNumber(params.responseData?.total_time ?? usage.total_time)

		if (
			promptTokens === null &&
			completionTokens === null &&
			totalTokens === null &&
			reasoningTokens === null &&
			promptTime === null &&
			completionTime === null &&
			totalTime === null
		) {
			return null
		}

		return await this.usageRepo.create({
			apiKeyId: params.apiKeyId,
			requestScope: params.requestScope,
			promptTokens,
			completionTokens,
			totalTokens,
			reasoningTokens,
			promptTime,
			completionTime,
			totalTime,
			requestType: params.requestType,
			metadata: params.metadata || null
		})
	}
}

export const usageTrackingService = new UsageTrackingService()
