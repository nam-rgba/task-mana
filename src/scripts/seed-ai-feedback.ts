import 'reflect-metadata'
import dotenv from 'dotenv'
dotenv.config()

import { AppDataSource } from '../db/data-source.js'
import { AiFeedback } from '~/model/ai-feedback.entity.js'
import { Task } from '~/model/task.entity.js'
import { User } from '~/model/user.entity.js'
import { AiActionType, FeedbackValue, FeedbackSource, FeedbackStatus } from '~/model/enums/ai-feedback.enum.js'

interface SeedTemplate {
	actionType: AiActionType
	projectId: number
	needsTaskId: boolean
	suggestedValue: Record<string, unknown>
	actualValue?: Record<string, unknown>
	feedback?: FeedbackValue
	feedbackSource?: FeedbackSource
	status: FeedbackStatus
	comment?: string
	metadata?: Record<string, unknown>
}

// Template data - taskId và userId sẽ được gán động từ DB
const seedTemplates: SeedTemplate[] = [
	// ─── Project 7: Story Point Suggestions ────────────────────────────────────
	{
		actionType: AiActionType.STORY_POINT_SUGGESTION,
		projectId: 7,
		needsTaskId: true,
		suggestedValue: { storyPoint: 5 },
		actualValue: { storyPoint: 5 },
		feedback: FeedbackValue.POSITIVE,
		feedbackSource: FeedbackSource.IMPLICIT,
		status: FeedbackStatus.RESOLVED,
		metadata: { modelVersion: 'gpt-4o', confidence: 0.92, promptId: 'sp-v2' }
	},
	{
		actionType: AiActionType.STORY_POINT_SUGGESTION,
		projectId: 7,
		needsTaskId: true,
		suggestedValue: { storyPoint: 8 },
		actualValue: { storyPoint: 5 },
		feedback: FeedbackValue.NEGATIVE,
		feedbackSource: FeedbackSource.IMPLICIT,
		status: FeedbackStatus.RESOLVED,
		metadata: { modelVersion: 'gpt-4o', confidence: 0.75, promptId: 'sp-v2' }
	},
	{
		actionType: AiActionType.STORY_POINT_SUGGESTION,
		projectId: 7,
		needsTaskId: true,
		suggestedValue: { storyPoint: 3 },
		feedback: FeedbackValue.POSITIVE,
		feedbackSource: FeedbackSource.EXPLICIT,
		status: FeedbackStatus.RESOLVED,
		metadata: { modelVersion: 'gpt-4o', confidence: 0.88, promptId: 'sp-v2' }
	},
	{
		actionType: AiActionType.STORY_POINT_SUGGESTION,
		projectId: 7,
		needsTaskId: false,
		suggestedValue: { storyPoint: 2 },
		status: FeedbackStatus.PENDING,
		metadata: { modelVersion: 'gpt-4o', confidence: 0.95, promptId: 'sp-v2' }
	},

	// ─── Project 7: Priority Suggestions ───────────────────────────────────────
	{
		actionType: AiActionType.PRIORITY_SUGGESTION,
		projectId: 7,
		needsTaskId: true,
		suggestedValue: { priority: 'HIGH' },
		actualValue: { priority: 'HIGH' },
		feedback: FeedbackValue.POSITIVE,
		feedbackSource: FeedbackSource.IMPLICIT,
		status: FeedbackStatus.RESOLVED,
		metadata: { modelVersion: 'gpt-4o', confidence: 0.87 }
	},
	{
		actionType: AiActionType.PRIORITY_SUGGESTION,
		projectId: 7,
		needsTaskId: true,
		suggestedValue: { priority: 'MEDIUM' },
		actualValue: { priority: 'LOW' },
		feedback: FeedbackValue.NEGATIVE,
		feedbackSource: FeedbackSource.IMPLICIT,
		status: FeedbackStatus.RESOLVED,
		comment: 'Task này không quan trọng lắm',
		metadata: { modelVersion: 'gpt-4o', confidence: 0.65 }
	},

	// ─── Project 7: Assignee Suggestions ───────────────────────────────────────
	{
		actionType: AiActionType.ASSIGNEE_SUGGESTION,
		projectId: 7,
		needsTaskId: true,
		suggestedValue: { assigneeId: 3 },
		actualValue: { assigneeId: 3 },
		feedback: FeedbackValue.POSITIVE,
		feedbackSource: FeedbackSource.IMPLICIT,
		status: FeedbackStatus.RESOLVED,
		metadata: { modelVersion: 'gpt-4o', confidence: 0.82, reason: 'Dựa trên lịch sử task tương tự' }
	},
	{
		actionType: AiActionType.ASSIGNEE_SUGGESTION,
		projectId: 7,
		needsTaskId: true,
		suggestedValue: { assigneeId: 4 },
		actualValue: { assigneeId: 2 },
		feedback: FeedbackValue.NEGATIVE,
		feedbackSource: FeedbackSource.IMPLICIT,
		status: FeedbackStatus.RESOLVED,
		metadata: { modelVersion: 'gpt-4o', confidence: 0.58 }
	},

	// ─── Project 7: Task Generation ────────────────────────────────────────────
	{
		actionType: AiActionType.TASK_GENERATION,
		projectId: 7,
		needsTaskId: false,
		suggestedValue: {
			tasks: [
				{ title: 'Thiết kế database schema', priority: 'HIGH' },
				{ title: 'Implement API endpoints', priority: 'HIGH' },
				{ title: 'Viết unit tests', priority: 'MEDIUM' }
			]
		},
		feedback: FeedbackValue.POSITIVE,
		feedbackSource: FeedbackSource.EXPLICIT,
		status: FeedbackStatus.RESOLVED,
		metadata: { modelVersion: 'gpt-4o', confidence: 0.9 }
	},
	{
		actionType: AiActionType.TASK_GENERATION,
		projectId: 7,
		needsTaskId: false,
		suggestedValue: {
			tasks: [
				{ title: 'Setup CI/CD pipeline', priority: 'HIGH' },
				{ title: 'Configure Docker', priority: 'MEDIUM' }
			]
		},
		status: FeedbackStatus.EXPIRED,
		metadata: { modelVersion: 'gpt-4o', confidence: 0.78 }
	},

	// ─── Project 8: Story Point Suggestions ────────────────────────────────────
	{
		actionType: AiActionType.STORY_POINT_SUGGESTION,
		projectId: 8,
		needsTaskId: true,
		suggestedValue: { storyPoint: 13 },
		actualValue: { storyPoint: 13 },
		feedback: FeedbackValue.POSITIVE,
		feedbackSource: FeedbackSource.IMPLICIT,
		status: FeedbackStatus.RESOLVED,
		metadata: { modelVersion: 'gpt-4o', confidence: 0.91, promptId: 'sp-v2' }
	},
	{
		actionType: AiActionType.STORY_POINT_SUGGESTION,
		projectId: 8,
		needsTaskId: true,
		suggestedValue: { storyPoint: 5 },
		actualValue: { storyPoint: 8 },
		feedback: FeedbackValue.NEGATIVE,
		feedbackSource: FeedbackSource.IMPLICIT,
		status: FeedbackStatus.RESOLVED,
		metadata: { modelVersion: 'gpt-4o', confidence: 0.72, promptId: 'sp-v2' }
	},
	{
		actionType: AiActionType.STORY_POINT_SUGGESTION,
		projectId: 8,
		needsTaskId: false,
		suggestedValue: { storyPoint: 3 },
		status: FeedbackStatus.PENDING,
		metadata: { modelVersion: 'gpt-4o', confidence: 0.85, promptId: 'sp-v2' }
	},

	// ─── Project 8: Task Description ───────────────────────────────────────────
	{
		actionType: AiActionType.TASK_DESCRIPTION,
		projectId: 8,
		needsTaskId: true,
		suggestedValue: {
			description:
				'Implement user authentication flow including login, logout, and session management. Use JWT for token-based authentication.'
		},
		feedback: FeedbackValue.POSITIVE,
		feedbackSource: FeedbackSource.EXPLICIT,
		status: FeedbackStatus.RESOLVED,
		metadata: { modelVersion: 'gpt-4o', confidence: 0.88 }
	},
	{
		actionType: AiActionType.TASK_DESCRIPTION,
		projectId: 8,
		needsTaskId: true,
		suggestedValue: {
			description: 'Create API endpoint for fetching user profile data with proper error handling and validation.'
		},
		feedback: FeedbackValue.NEGATIVE,
		feedbackSource: FeedbackSource.EXPLICIT,
		status: FeedbackStatus.RESOLVED,
		comment: 'Mô tả quá chung chung, cần chi tiết hơn',
		metadata: { modelVersion: 'gpt-4o', confidence: 0.7 }
	},

	// ─── Project 8: Task Split ─────────────────────────────────────────────────
	{
		actionType: AiActionType.TASK_SPLIT,
		projectId: 8,
		needsTaskId: true,
		suggestedValue: {
			subtasks: [
				{ title: 'Research existing payment providers', storyPoint: 2 },
				{ title: 'Integrate Stripe SDK', storyPoint: 5 },
				{ title: 'Implement payment UI components', storyPoint: 3 },
				{ title: 'Add payment webhook handlers', storyPoint: 3 }
			]
		},
		feedback: FeedbackValue.POSITIVE,
		feedbackSource: FeedbackSource.EXPLICIT,
		status: FeedbackStatus.RESOLVED,
		metadata: { modelVersion: 'gpt-4o', confidence: 0.85 }
	},

	// ─── Project 8: Duplicate Check ────────────────────────────────────────────
	{
		actionType: AiActionType.DUPLICATE_CHECK,
		projectId: 8,
		needsTaskId: true,
		suggestedValue: {
			isDuplicate: true,
			similarTaskIds: [8, 9],
			similarity: 0.87
		},
		feedback: FeedbackValue.POSITIVE,
		feedbackSource: FeedbackSource.EXPLICIT,
		status: FeedbackStatus.RESOLVED,
		metadata: { modelVersion: 'gpt-4o', confidence: 0.87 }
	},
	{
		actionType: AiActionType.DUPLICATE_CHECK,
		projectId: 8,
		needsTaskId: true,
		suggestedValue: {
			isDuplicate: true,
			similarTaskIds: [5],
			similarity: 0.65
		},
		feedback: FeedbackValue.NEGATIVE,
		feedbackSource: FeedbackSource.EXPLICIT,
		status: FeedbackStatus.RESOLVED,
		comment: 'Đây là task hoàn toàn khác',
		metadata: { modelVersion: 'gpt-4o', confidence: 0.65 }
	},

	// ─── Project 8: Priority & Assignee Suggestions ────────────────────────────
	{
		actionType: AiActionType.PRIORITY_SUGGESTION,
		projectId: 8,
		needsTaskId: true,
		suggestedValue: { priority: 'URGENT' },
		actualValue: { priority: 'URGENT' },
		feedback: FeedbackValue.POSITIVE,
		feedbackSource: FeedbackSource.IMPLICIT,
		status: FeedbackStatus.RESOLVED,
		metadata: { modelVersion: 'gpt-4o', confidence: 0.95 }
	},
	{
		actionType: AiActionType.ASSIGNEE_SUGGESTION,
		projectId: 8,
		needsTaskId: true,
		suggestedValue: { assigneeId: 1, reason: 'Senior dev phù hợp với bug phức tạp' },
		actualValue: { assigneeId: 1 },
		feedback: FeedbackValue.POSITIVE,
		feedbackSource: FeedbackSource.IMPLICIT,
		status: FeedbackStatus.RESOLVED,
		metadata: { modelVersion: 'gpt-4o', confidence: 0.89 }
	}
]

async function seed() {
	try {
		console.log('🔌 Đang kết nối database...')
		await AppDataSource.initialize()
		console.log('✅ Đã kết nối database thành công')

		const feedbackRepo = AppDataSource.getRepository(AiFeedback)
		const taskRepo = AppDataSource.getRepository(Task)
		const userRepo = AppDataSource.getRepository(User)

		// Lấy tasks từ project 7 và 8
		const tasks7 = await taskRepo.find({ where: { projectId: 7 }, order: { id: 'ASC' }, take: 20 })
		const tasks8 = await taskRepo.find({ where: { projectId: 8 }, order: { id: 'ASC' }, take: 20 })

		// Lấy danh sách users
		const users = await userRepo.find({ order: { id: 'ASC' }, take: 10 })

		if (users.length === 0) {
			console.error('❌ Không tìm thấy user nào trong database!')
			process.exit(1)
		}

		console.log(`📋 Tìm thấy ${tasks7.length} tasks cho project 7`)
		console.log(`📋 Tìm thấy ${tasks8.length} tasks cho project 8`)
		console.log(`👥 Tìm thấy ${users.length} users`)

		const taskIds7 = tasks7.map((t) => t.id)
		const taskIds8 = tasks8.map((t) => t.id)
		const userIds = users.map((u) => u.id)

		let taskIndex7 = 0
		let taskIndex8 = 0

		const seedData: Partial<AiFeedback>[] = []

		for (const template of seedTemplates) {
			const data: Partial<AiFeedback> = {
				actionType: template.actionType,
				projectId: template.projectId,
				userId: userIds[Math.floor(Math.random() * userIds.length)],
				suggestedValue: template.suggestedValue,
				actualValue: template.actualValue,
				feedback: template.feedback,
				feedbackSource: template.feedbackSource,
				status: template.status,
				comment: template.comment,
				metadata: template.metadata
			}

			// Gán taskId nếu cần và có task available
			if (template.needsTaskId) {
				if (template.projectId === 7 && taskIndex7 < taskIds7.length) {
					data.taskId = taskIds7[taskIndex7++]
				} else if (template.projectId === 8 && taskIndex8 < taskIds8.length) {
					data.taskId = taskIds8[taskIndex8++]
				}
				// Nếu không có task available thì để undefined (nullable)
			}

			seedData.push(data)
		}

		console.log(`📝 Đang seed ${seedData.length} AI feedback records...`)

		for (const feedbackData of seedData) {
			const feedback = feedbackRepo.create(feedbackData)
			await feedbackRepo.save(feedback)
		}

		console.log('✅ Đã seed thành công tất cả AI feedback records')
		console.log(`📊 Tổng số records đã tạo: ${seedData.length}`)

		// Hiển thị thống kê
		const stats = {
			total: seedData.length,
			project7: seedData.filter((f) => f.projectId === 7).length,
			project8: seedData.filter((f) => f.projectId === 8).length,
			positive: seedData.filter((f) => f.feedback === FeedbackValue.POSITIVE).length,
			negative: seedData.filter((f) => f.feedback === FeedbackValue.NEGATIVE).length,
			pending: seedData.filter((f) => f.status === FeedbackStatus.PENDING).length,
			resolved: seedData.filter((f) => f.status === FeedbackStatus.RESOLVED).length,
			expired: seedData.filter((f) => f.status === FeedbackStatus.EXPIRED).length,
			withTaskId: seedData.filter((f) => f.taskId).length,
			byActionType: {} as Record<string, number>
		}

		// Đếm theo action type
		for (const feedback of seedData) {
			const type = feedback.actionType!
			stats.byActionType[type] = (stats.byActionType[type] || 0) + 1
		}

		console.log('\n📊 Thống kê:')
		console.log(`   - Tổng records: ${stats.total}`)
		console.log(`   - Project 7: ${stats.project7}`)
		console.log(`   - Project 8: ${stats.project8}`)
		console.log(`   - Có taskId: ${stats.withTaskId}`)
		console.log(`   - Positive feedback: ${stats.positive}`)
		console.log(`   - Negative feedback: ${stats.negative}`)
		console.log(`   - Pending: ${stats.pending}`)
		console.log(`   - Resolved: ${stats.resolved}`)
		console.log(`   - Expired: ${stats.expired}`)
		console.log('\n   Theo loại AI action:')
		for (const [type, count] of Object.entries(stats.byActionType)) {
			console.log(`   - ${type}: ${count}`)
		}

		await AppDataSource.destroy()
		console.log('\n✅ Hoàn tất!')
		process.exit(0)
	} catch (error) {
		console.error('❌ Lỗi khi seed data:', error)
		process.exit(1)
	}
}

seed()
