import { getAiFeedbackRepository } from '~/repository/ai-feedback.repository.js'
import { AiFeedback } from '~/model/ai-feedback.entity.js'
import { FeedbackSource, FeedbackStatus, FeedbackValue } from '~/model/enums/ai-feedback.enum.js'
import {
	CreateAiFeedbackDTO,
	ExplicitFeedbackDTO,
	ImplicitFeedbackDTO,
	AiFeedbackQuery,
	ProjectAiFeedbackSummary
} from '~/types/ai-feedback.type.js'

export class AiFeedbackService {
	private repo = getAiFeedbackRepository()

	// ────────────────────────────────────────────────────────────────────────────
	// Tạo record khi AI vừa đưa ra gợi ý (gọi nội bộ từ các AI service khác)
	// Trả về feedbackId để frontend giữ lại, dùng khi lưu form
	// ────────────────────────────────────────────────────────────────────────────

	async trackSuggestion(dto: CreateAiFeedbackDTO): Promise<AiFeedback> {
		const record = this.repo.create({
			...dto,
			status: FeedbackStatus.PENDING
		})
		return this.repo.save(record)
	}

	// ────────────────────────────────────────────────────────────────────────────
	// Explicit feedback: người dùng bấm like / dislike trực tiếp trên UI
	// ────────────────────────────────────────────────────────────────────────────

	async submitExplicit(id: number, dto: ExplicitFeedbackDTO): Promise<AiFeedback> {
		const record = await this.repo.findById(id)
		if (!record) throw new Error(`AiFeedback #${id} not found`)
		if (record.status === FeedbackStatus.RESOLVED) throw new Error(`Feedback #${id} already resolved`)

		record.feedback = dto.feedback
		record.feedbackSource = FeedbackSource.EXPLICIT
		record.status = FeedbackStatus.RESOLVED
		if (dto.comment) record.comment = dto.comment

		return this.repo.save(record)
	}

	// ────────────────────────────────────────────────────────────────────────────
	// Implicit feedback: người dùng lưu form (task creation / update)
	//
	// Logic:
	//   - So sánh từng key trong suggestedValue với actualValue
	//   - Match hoàn toàn → POSITIVE
	//   - Bất kỳ key nào khác → NEGATIVE
	//
	// Gọi từ TaskService khi create/update task nếu request có aiFeedback field
	// ────────────────────────────────────────────────────────────────────────────

	async submitImplicit(dto: ImplicitFeedbackDTO): Promise<AiFeedback> {
		const record = await this.repo.findById(dto.feedbackId)
		if (!record) throw new Error(`AiFeedback #${dto.feedbackId} not found`)
		if (record.status === FeedbackStatus.RESOLVED) return record // idempotent

		const isMatch = this.valuesMatch(record.suggestedValue, dto.actualValue)

		record.actualValue = dto.actualValue
		record.feedback = isMatch ? FeedbackValue.POSITIVE : FeedbackValue.NEGATIVE
		record.feedbackSource = FeedbackSource.IMPLICIT
		record.status = FeedbackStatus.RESOLVED
		if (dto.taskId) record.taskId = dto.taskId

		return this.repo.save(record)
	}

	// ────────────────────────────────────────────────────────────────────────────
	// Dashboard & Query
	// ────────────────────────────────────────────────────────────────────────────

	async getList(query: AiFeedbackQuery) {
		const page = query.page ?? 1
		const limit = query.limit ?? 20
		const [feedbacks, total] = await this.repo.findWithFilters(query)
		const pages = Math.ceil(total / limit)
		return { feedbacks, page: { total, currentPage: page, pages } }
	}

	async getById(id: number): Promise<AiFeedback> {
		const record = await this.repo.findById(id)
		if (!record) throw new Error(`AiFeedback #${id} not found`)
		return record
	}

	async getProjectSummary(projectId: number): Promise<ProjectAiFeedbackSummary> {
		const byActionType = await this.repo.getStatsByProject(projectId)

		const totalSuggestions = byActionType.reduce((acc, s) => acc + s.total, 0)
		const positiveCount = byActionType.reduce((acc, s) => acc + s.positive, 0)
		const negativeCount = byActionType.reduce((acc, s) => acc + s.negative, 0)
		const resolvedCount = positiveCount + negativeCount

		return {
			projectId,
			totalSuggestions,
			resolvedCount,
			positiveCount,
			negativeCount,
			overallAcceptanceRate: resolvedCount > 0 ? positiveCount / resolvedCount : 0,
			byActionType
		}
	}

	// ────────────────────────────────────────────────────────────────────────────
	// Cron job: expire các pending record quá 7 ngày
	// ────────────────────────────────────────────────────────────────────────────

	async expireStalePending(): Promise<number> {
		const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
		return this.repo.expireOldPending(sevenDaysMs)
	}

	// ────────────────────────────────────────────────────────────────────────────
	// Helper
	// ────────────────────────────────────────────────────────────────────────────

	/**
	 * So sánh suggestedValue với actualValue.
	 * Chỉ so sánh các key có trong suggestedValue để tránh false negative
	 * khi actualValue chứa thêm fields khác.
	 */
	private valuesMatch(suggested: Record<string, unknown>, actual: Record<string, unknown>): boolean {
		return Object.entries(suggested).every(([key, val]) => {
			const actualVal = actual[key]
			// So sánh loose để handle number vs string edge cases từ form
			// eslint-disable-next-line eqeqeq
			return actualVal == val
		})
	}
}

export const aiFeedbackService = new AiFeedbackService()
