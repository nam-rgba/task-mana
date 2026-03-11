import axios, { AxiosError } from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import http from 'http'
import https from 'https'
import { AppDataSource } from '~/db/data-source.js'
import { Schedule } from '~/model/schedule.entity.js'
import { Task } from '~/model/task.entity.js'
import { ScheduleStatus } from '~/model/enums/gantt.enum.js'
import { TaskStatus, TaskPriority, TaskType } from '~/types/task.type.js'

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

	async generateProjectSchedule(filePath: string, projectId: number) {
		const formData = new FormData()
		formData.append('files', fs.createReadStream(filePath))
		formData.append('project_id', projectId)

		let aiPhases: any
		try {
			const res = await this.axiosInstance.post(`${this.aiServiceUrl}/llm/generate_phases`, formData, {
				headers: formData.getHeaders(),
				timeout: 300_000
			})
			aiPhases = res.data
		} catch (error: any) {
			if (error.code === 'ECONNRESET') {
				throw new Error('Kết nối đến Python server bị đóng đột ngột. Kiểm tra server Python có đang chạy không.')
			} else if (error.code === 'ECONNREFUSED') {
				throw new Error(`Không thể kết nối đến Python server tại ${this.aiServiceUrl}. Server có đang chạy không?`)
			} else if (error.code === 'ETIMEDOUT') {
				throw new Error('Request timeout khi gọi Python server. Request mất quá 5 phút.')
			} else if (error.response) {
				throw new Error(`Python server trả về lỗi: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
			}
			throw error
		} finally {
			fs.unlink(filePath, () => {})
		}

		// Map AI phases → Schedule + Task entities và lưu DB
		const scheduleRepo = AppDataSource.getRepository(Schedule)
		const taskRepo = AppDataSource.getRepository(Task)

		const phases: any[] = Array.isArray(aiPhases) ? aiPhases : (aiPhases?.phases ?? aiPhases?.data ?? [])
		const savedSchedules = []

		for (let i = 0; i < phases.length; i++) {
			const phase = phases[i]

			const startTs = phase.start_date
				? Math.floor(new Date(phase.start_date).getTime() / 1000)
				: Math.floor(Date.now() / 1000)
			const endTs = phase.end_date ? Math.floor(new Date(phase.end_date).getTime() / 1000) : startTs + 14 * 86400

			const schedule = scheduleRepo.create({
				name: phase.name || phase.title || `Phase ${i + 1}`,
				description: phase.description || null,
				startDate: startTs,
				endDate: endTs,
				status: ScheduleStatus.PLANNED,
				color: phase.color || '#6366f1',
				projectId,
				sortOrder: i
			})
			const savedSchedule = await scheduleRepo.save(schedule)

			savedSchedules.push(savedSchedule)
		}

		return savedSchedules
	}

	private mapTaskType(type?: string): TaskType {
		if (!type) return TaskType.Feature
		const map: Record<string, TaskType> = {
			feature: TaskType.Feature,
			bug: TaskType.Bug,
			improvement: TaskType.Improvement,
			research: TaskType.Research,
			documentation: TaskType.Documentation,
			testing: TaskType.Testing,
			deployment: TaskType.Deployment,
			enhancement: TaskType.Enhancement,
			maintenance: TaskType.Maintenance
		}
		return map[type.toLowerCase()] || TaskType.Feature
	}

	private mapPriority(priority?: string): TaskPriority {
		if (!priority) return TaskPriority.Medium
		const map: Record<string, TaskPriority> = {
			low: TaskPriority.Low,
			medium: TaskPriority.Medium,
			high: TaskPriority.High,
			urgent: TaskPriority.Urgent
		}
		return map[priority.toLowerCase()] || TaskPriority.Medium
	}
}

export const aiGenService = new AiGenService()
