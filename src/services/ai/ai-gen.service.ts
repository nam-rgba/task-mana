import axios, { AxiosError } from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import http from 'http'
import https from 'https'
import { AppDataSource } from '~/db/data-source.js'
import { Schedule } from '~/model/schedule.entity.js'
import { Task } from '~/model/task.entity.js'
import { Project } from '~/model/project.entity.js'
import { TeamMember } from '~/model/teamMember.entity.js'
import { ScheduleStatus } from '~/model/enums/gantt.enum.js'
import { TaskStatus, TaskPriority, TaskType } from '~/types/task.type.js'
import { aiLogger } from './ai-logger.service.js'
import { CloudinaryService } from '~/services/upload/cloudinary.service.js'
import { apiKeyService } from '~/services/api-key.service.js'
import { RequestScope, usageTrackingService } from '~/services/usage-tracking.service.js'
import { notificationService } from '~/services/notification/notification.service.js'

type AiRequestContext = {
	userId?: number
	requestType?: 'chat' | 'vision'
	metadata?: Record<string, unknown>
}

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

	private async resolveGroqContext(context?: AiRequestContext) {
		if (!context?.userId) return null
		try {
			const selectedApiKey = await apiKeyService.resolveSelectedApiKeyForUser(context.userId)
			if (!selectedApiKey) {
				console.warn(`[AI_USAGE] No active selected API key resolved for user ${context.userId}`)
				return null
			}

			console.log(`[AI_USAGE] Resolved selected API key ${selectedApiKey.id} for user ${context.userId}`)
			return selectedApiKey
		} catch (error) {
			console.error(`[AI_USAGE] Failed to resolve selected API key for user ${context.userId}`, error)
			return null
		}
	}

	private async saveGroqUsage(
		responseData: any,
		context: AiRequestContext | undefined,
		requestScope: RequestScope,
		apiKeyId?: number
	) {
		if (!apiKeyId) {
			console.warn('[AI_USAGE] Skip saving usage because apiKeyId is missing', {
				requestScope,
				requestType: context?.requestType || 'chat',
				metadata: context?.metadata || null
			})
			return null
		}

		const savedUsage = await usageTrackingService.trackFromGroqResponse({
			apiKeyId,
			responseData,
			requestType: context?.requestType || 'chat',
			requestScope,
			metadata: context?.metadata
		})

		if (!savedUsage) {
			console.warn('[AI_USAGE] Skip saving usage because response has no usage payload', {
				apiKeyId,
				requestScope,
				requestType: context?.requestType || 'chat'
			})
			return null
		}

		console.log(`[AI_USAGE] Saved usage ${savedUsage.id} for apiKey ${apiKeyId} (${requestScope})`)
		return savedUsage
	}

	private async makeRequest(endpoint: string, body: any, scope: RequestScope, context?: AiRequestContext) {
		const url = `${this.aiServiceUrl}${endpoint}`
		const selectedApiKey = await this.resolveGroqContext(context)
		const headers = selectedApiKey?.decryptedKey
			? {
					'x-api-key': selectedApiKey.decryptedKey,
					'x-provider': selectedApiKey.provider,
					'x-model-name': selectedApiKey.modelname
				}
			: undefined
		const { startTime } = aiLogger.logRequest('POST', url, body, headers)
		try {
			const res = await this.axiosInstance.post(
				url,
				body,
				headers
					? {
							headers
						}
					: undefined
			)
			await this.saveGroqUsage(res.data, context, scope, selectedApiKey?.id)
			aiLogger.logResponse('POST', url, res.status, res.data, startTime)
			return res.data
		} catch (error: any) {
			aiLogger.logError('POST', url, error, startTime)
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

	async generateTask(body: any, context?: AiRequestContext) {
		return this.makeRequest('/llm/compose', body, RequestScope.TASK, { requestType: 'chat', ...context })
	}

	async suggestDeveloper(body: any, context?: AiRequestContext) {
		// TODO(ai-feedback): wrap result with trackSuggestion(AiActionType.ASSIGNEE_SUGGESTION)
		// and return feedbackId alongside the suggestion so the FE can submit explicit feedback.
		return this.makeRequest('/llm/assign', body, RequestScope.ASSIGN, { requestType: 'chat', ...context })
	}

	async estimateEffort(body: any, context?: AiRequestContext) {
		// TODO(ai-feedback): wrap result with trackSuggestion(AiActionType.STORY_POINT_SUGGESTION)
		// and return feedbackId alongside the suggestion so the FE can submit implicit feedback.
		return this.makeRequest('/llm/estimate_sp', body, RequestScope.STORYPOINT, { requestType: 'chat', ...context })
	}

	async suggestTaskToday(body: any, context?: AiRequestContext) {
		return this.makeRequest('/llm/suggest_tasks_for_today', body, RequestScope.TASK, {
			requestType: 'chat',
			...context
		})
	}

	async generateCompleteTask(body: any, context?: AiRequestContext) {
		return this.makeRequest('/llm/generate_task', body, RequestScope.TASK, { requestType: 'chat', ...context })
	}

	async checkDuplicateTask(body: any, context?: AiRequestContext) {
		return this.makeRequest('/llm/duplicate', body, RequestScope.TASK, { requestType: 'chat', ...context })
	}

	async reviewPerformance(body: any, context?: AiRequestContext) {
		return this.makeRequest('/llm/review_performance', body, RequestScope.PERFORMANCE, {
			requestType: 'chat',
			...context
		})
	}

	async generateProjectSchedule(filePath: string, projectId: number, context?: AiRequestContext) {
		const formData = new FormData()
		formData.append('files', fs.createReadStream(filePath))
		formData.append('project_id', projectId)
		const selectedApiKey = await this.resolveGroqContext(context)

		let aiPhases: any
		try {
			const res = await this.axiosInstance.post(`${this.aiServiceUrl}/llm/generate_phases`, formData, {
				headers: {
					...formData.getHeaders(),
					...(selectedApiKey?.decryptedKey
						? {
								'x-api-key': selectedApiKey.decryptedKey,
								'x-provider': selectedApiKey.provider,
								'x-model-name': selectedApiKey.modelname
							}
						: {})
				},
				timeout: 300_000
			})
			aiPhases = res.data
			await this.saveGroqUsage(
				aiPhases,
				{
					requestType: 'vision',
					metadata: {
						projectId,
						...(context?.metadata || {})
					}
				},
				RequestScope.SCHEDULED,
				selectedApiKey?.id
			)
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

	/**
	 * SSE streaming: upload file → generate schedules → generate tasks per schedule
	 * Sends SSE events to the Response object throughout the process.
	 */
	async generateProjectWithSSE(
		filePath: string,
		projectId: number,
		res: import('express').Response,
		context?: AiRequestContext
	) {
		const sendEvent = (event: string, data: any) => {
			res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
		}

		try {
			// ── Step 1: Upload file to Cloudinary & generate phases from AI ──
			sendEvent('phase_start', { message: 'Đang tải tài liệu lên và phân tích...' })

			// Upload to Cloudinary first (while file still exists)
			const { url: fileUrl } = await CloudinaryService.uploadImageFromLocal({
				filePath,
				folder: `projects/${projectId}/documents`,
				resourceType: 'raw'
			})

			// Save useCaseUrl to project
			const projectRepo = AppDataSource.getRepository(Project)
			await projectRepo.update(projectId, { useCaseUrl: fileUrl })

			const formData = new FormData()
			formData.append('files', fs.createReadStream(filePath))
			formData.append('project_id', projectId)
			const selectedApiKey = await this.resolveGroqContext(context)
			const phaseHeaders = {
				...formData.getHeaders(),
				...(selectedApiKey?.decryptedKey
					? {
							'x-api-key': selectedApiKey.decryptedKey,
							'x-provider': selectedApiKey.provider,
							'x-model-name': selectedApiKey.modelname
						}
					: {})
			}

			let aiPhases: any
			const phaseUrl = `${this.aiServiceUrl}/llm/generate_phases`
			const { startTime: phaseStart } = aiLogger.logRequest(
				'POST',
				phaseUrl,
				'[FormData: file + project_id]',
				phaseHeaders
			)
			try {
				const result = await this.axiosInstance.post(phaseUrl, formData, {
					headers: phaseHeaders,
					timeout: 300_000
				})
				aiPhases = result.data
				await this.saveGroqUsage(
					aiPhases,
					{
						requestType: 'vision',
						metadata: {
							projectId,
							...(context?.metadata || {})
						}
					},
					RequestScope.SCHEDULED,
					selectedApiKey?.id
				)
				aiLogger.logResponse('POST', phaseUrl, result.status, aiPhases, phaseStart)
			} catch (error: any) {
				aiLogger.logError('POST', phaseUrl, error, phaseStart)
				throw error
			} finally {
				fs.unlink(filePath, () => {})
			}

			const phases: any[] = Array.isArray(aiPhases) ? aiPhases : (aiPhases?.phases ?? aiPhases?.data ?? [])

			// ── Step 2: Save schedules to DB ──
			const scheduleRepo = AppDataSource.getRepository(Schedule)
			const taskRepo = AppDataSource.getRepository(Task)
			const savedSchedules = []

			for (let i = 0; i < phases.length; i++) {
				const phase = phases[i]
				const rawStart = phase.start_date || phase.phase_start
				const rawEnd = phase.end_date || phase.phase_end
				const startTs = rawStart ? Math.floor(new Date(rawStart).getTime() / 1000) : Math.floor(Date.now() / 1000)
				const endTs = rawEnd ? Math.floor(new Date(rawEnd).getTime() / 1000) : startTs + 14 * 86400

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
				const saved = await scheduleRepo.save(schedule)
				savedSchedules.push(saved)
			}

			sendEvent('schedules_done', {
				schedules: savedSchedules,
				total: savedSchedules.length
			})

			// ── Step 3: Load team members for this project ──
			const project = await AppDataSource.getRepository(Project).findOne({
				where: { id: projectId },
				select: ['id', 'teamId', 'name']
			})

			const teamMembers = project?.teamId
				? await AppDataSource.getRepository(TeamMember).find({
						where: { teamId: project.teamId, isActive: true },
						relations: ['user']
					})
				: []

			const users = teamMembers
				.filter((tm) => tm.user)
				.map((tm) => ({
					id: tm.user.id,
					name: tm.user.name,
					email: tm.user.email,
					position: tm.user.position || '',
					skills: [] as string[],
					experience_years: tm.user.yearOfExperience ?? 0
				}))

			// ── Step 4: Generate tasks for each schedule ──
			let totalTasksCreated = 0
			const taskCountByAssignee = new Map<number, number>()

			for (let i = 0; i < savedSchedules.length; i++) {
				const schedule = savedSchedules[i]

				sendEvent('task_progress', {
					scheduleIndex: i,
					scheduleName: schedule.name,
					totalSchedules: savedSchedules.length,
					status: 'generating'
				})

				// Delay giữa các request để tránh overload AI server (đặc biệt qua ngrok)
				if (i > 0) {
					await new Promise((resolve) => setTimeout(resolve, 2000))
				}

				try {
					const aiTasks = await this.makeRequest(
						'/llm/generate_tasks',
						{
							project_id: projectId,
							users,
							phase_content: {
								title: schedule.name,
								description: schedule.description || '',
								phase_start: new Date(schedule.startDate * 1000).toISOString().split('T')[0],
								phase_end: new Date(schedule.endDate * 1000).toISOString().split('T')[0]
							}
						},
						RequestScope.TASK4SCHEDULED,
						{
							requestType: 'chat',
							userId: context?.userId,
							metadata: {
								projectId,
								scheduleId: schedule.id,
								...(context?.metadata || {})
							}
						}
					)

					const tasks: any[] = Array.isArray(aiTasks) ? aiTasks : (aiTasks?.tasks ?? aiTasks?.data ?? [])
					const savedTasks = []

					for (let j = 0; j < tasks.length; j++) {
						const t = tasks[j]
						const taskStartTs = t.start_date ? Math.floor(new Date(t.start_date).getTime() / 1000) : schedule.startDate
						const taskEndTs = t.end_date
							? Math.floor(new Date(t.end_date).getTime() / 1000)
							: t.due_date
								? Math.floor(new Date(t.due_date).getTime() / 1000)
								: schedule.endDate
						const rawEstimateEffort = t.estimate_effort ?? t.story_point ?? t.story_points
						const estimateEffort = Number.isFinite(Number(rawEstimateEffort)) ? Number(rawEstimateEffort) : 0
						const rawAssigneeId = t.assignee
						const assigneeId = Number.isInteger(Number(rawAssigneeId)) ? Number(rawAssigneeId) : undefined

						const task = taskRepo.create({
							title: t.title || t.name || `Task ${j + 1}`,
							description: t.description || null,
							status: TaskStatus.Pending,
							type: this.mapTaskType(t.type),
							priority: this.mapPriority(t.priority),
							startDate: taskStartTs,
							dueDate: taskEndTs,
							duration: t.duration || null,
							estimateEffort,
							scheduleId: schedule.id,
							projectId,
							assigneeId,
							sortOrder: j
						})
						const saved = await taskRepo.save(task)
						savedTasks.push(saved)

						if (assigneeId) {
							taskCountByAssignee.set(assigneeId, (taskCountByAssignee.get(assigneeId) ?? 0) + 1)
						}
					}

					totalTasksCreated += savedTasks.length

					sendEvent('task_done', {
						scheduleIndex: i,
						scheduleName: schedule.name,
						tasksCreated: savedTasks.length,
						tasks: savedTasks
					})
				} catch (err: any) {
					sendEvent('task_error', {
						scheduleIndex: i,
						scheduleName: schedule.name,
						error: err.message
					})
				}
			}

			await Promise.all(
				Array.from(taskCountByAssignee.entries()).map(async ([assigneeId, taskCount]) => {
					await notificationService.notifyBulkProjectAssignment({
						recipientUserId: assigneeId,
						projectId,
						projectName: project?.name || `Project ${projectId}`,
						taskCount
					})
				})
			)

			// ── Step 4: Complete ──
			sendEvent('complete', {
				totalSchedules: savedSchedules.length,
				totalTasks: totalTasksCreated
			})
		} catch (err: any) {
			sendEvent('error', { message: err.message })
		} finally {
			res.end()
		}
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

	// logic for review user perfomance
}

export const aiGenService = new AiGenService()
