import { AiActionType, FeedbackValue, FeedbackSource, FeedbackStatus } from '~/model/enums/ai-feedback.enum.js'

// ─── Request DTOs ─────────────────────────────────────────────────────────────

/**
 * Payload khi AI trả về gợi ý → tạo feedback record ở trạng thái PENDING.
 * Gọi nội bộ từ service, không phải từ client.
 */
export interface CreateAiFeedbackDTO {
	actionType: AiActionType
	projectId?: number
	taskId?: number
	userId: number
	suggestedValue: Record<string, unknown>
	/** Thông tin AI metadata: model, confidence, ... */
	metadata?: Record<string, unknown>
}

/**
 * Explicit feedback: người dùng bấm like/dislike sau khi AI làm xong.
 * POST /ai-feedback/:id/explicit
 */
export interface ExplicitFeedbackDTO {
	feedback: FeedbackValue
	comment?: string
}

/**
 * Implicit feedback: gửi kèm khi lưu form có gợi ý AI.
 * Ví dụ: gửi cùng với task creation payload.
 * POST /task (kèm field aiFeedback)
 */
export interface ImplicitFeedbackDTO {
	/** ID của AiFeedback record đã tạo khi AI gợi ý */
	feedbackId: number
	/** Giá trị người dùng thực sự lưu (để so sánh với suggestedValue) */
	actualValue: Record<string, unknown>
	/** taskId nếu AiFeedback chưa có taskId (tạo task mới) */
	taskId?: number
}

// ─── Query / Filter ───────────────────────────────────────────────────────────

export interface AiFeedbackQuery {
	projectId?: number
	taskId?: number
	userId?: number
	actionType?: AiActionType
	feedback?: FeedbackValue
	feedbackSource?: FeedbackSource
	status?: FeedbackStatus
	/** Unix timestamp ms - lọc từ ngày */
	fromDate?: number
	/** Unix timestamp ms - lọc đến ngày */
	toDate?: number
	page?: number
	limit?: number
}

// ─── Response / Stats ─────────────────────────────────────────────────────────

/**
 * Dashboard stats: tổng hợp tỉ lệ chấp nhận gợi ý của AI theo từng loại hành động
 */
export interface AiFeedbackStats {
	actionType: AiActionType
	total: number
	positive: number
	negative: number
	pending: number
	/** Tỉ lệ chấp nhận (positive / resolved) */
	acceptanceRate: number
}

/**
 * Dashboard stats tổng hợp cho toàn dự án
 */
export interface ProjectAiFeedbackSummary {
	projectId: number
	totalSuggestions: number
	resolvedCount: number
	positiveCount: number
	negativeCount: number
	overallAcceptanceRate: number
	byActionType: AiFeedbackStats[]
}
