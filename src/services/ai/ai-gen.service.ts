import axios, { AxiosError } from 'axios'
import http from 'http'
import https from 'https'

class AiGenService {
	private aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/ai'
	private axiosInstance

	constructor() {
		// Cấu hình axios instance với keep-alive và retry
		this.axiosInstance = axios.create({
			timeout: 120_000, // Tăng timeout lên 120s
			headers: {
				'Content-Type': 'application/json',
				Connection: 'keep-alive'
			},
			// Cấu hình keep-alive agent để tránh lỗi ECONNRESET
			httpAgent: new http.Agent({
				keepAlive: true,
				keepAliveMsecs: 30000,
				maxSockets: 50,
				maxFreeSockets: 10,
				timeout: 120000
			}),
			httpsAgent: new https.Agent({
				keepAlive: true,
				keepAliveMsecs: 30000,
				maxSockets: 50,
				maxFreeSockets: 10,
				timeout: 120000
			})
		})

		// Thêm interceptor để retry khi gặp lỗi
		this.axiosInstance.interceptors.response.use(
			(response) => response,
			async (error: AxiosError) => {
				const config = error.config as any

				// Retry logic cho ECONNRESET và network errors
				if (!config || !config.retry) {
					config.retry = 0
				}

				const shouldRetry =
					config.retry < 3 &&
					(error.code === 'ECONNRESET' ||
						error.code === 'ETIMEDOUT' ||
						error.code === 'ECONNREFUSED' ||
						!error.response)

				if (shouldRetry) {
					config.retry += 1
					console.log(`Retry attempt ${config.retry} for ${config.url}`)

					// Đợi trước khi retry (exponential backoff)
					await new Promise((resolve) => setTimeout(resolve, 1000 * config.retry))

					return this.axiosInstance(config)
				}

				return Promise.reject(error)
			}
		)
	}

	private async makeRequest(endpoint: string, body: any) {
		try {
			const res = await this.axiosInstance.post(`${this.aiServiceUrl}${endpoint}`, body)
			return res.data
		} catch (error: any) {
			// Xử lý lỗi chi tiết hơn
			if (error.code === 'ECONNRESET') {
				throw new Error(`Kết nối đến Python server bị đóng đột ngột. Kiểm tra server Python có đang chạy không.`)
			} else if (error.code === 'ECONNREFUSED') {
				throw new Error(`Không thể kết nối đến Python server tại ${this.aiServiceUrl}. Server có đang chạy không?`)
			} else if (error.code === 'ETIMEDOUT') {
				throw new Error(`Request timeout khi gọi Python server. Request mất quá 120s.`)
			} else if (error.response) {
				throw new Error(`Python server trả về lỗi: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
			}
			throw error
		}
	}

	async generateTask(body: any) {
		return this.makeRequest('/llm/compose', body)
	}

	async suggestDeveloper(body: any) {
		// TODO(ai-feedback): wrap result with trackSuggestion(AiActionType.ASSIGNEE_SUGGESTION)
		// and return feedbackId alongside the suggestion so the FE can submit explicit feedback.
		return this.makeRequest('/llm/assign', body)
	}

	async estimateEffort(body: any) {
		// TODO(ai-feedback): wrap result with trackSuggestion(AiActionType.STORY_POINT_SUGGESTION)
		// and return feedbackId alongside the suggestion so the FE can submit implicit feedback.
		return this.makeRequest('/llm/estimate_sp', body)
	}

	async suggestTaskToday(body: any) {
		return this.makeRequest('/llm/suggest_tasks_for_today', body)
	}

	async generateCompleteTask(body: any) {
		return this.makeRequest('/llm/generate_task', body)
	}

	async checkDuplicateTask(body: any) {
		return this.makeRequest('/llm/duplicate', body)
	}
}

export const aiGenService = new AiGenService()
