import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm'
import { AppBaseEntity } from './base.entity.js'
import { AiActionType, FeedbackValue, FeedbackSource, FeedbackStatus } from './enums/ai-feedback.enum.js'
import { User } from './user.entity.js'
import { Project } from './project.entity.js'
import { Task } from './task.entity.js'

/**
 * Entity lưu trữ từng lần AI đưa ra gợi ý và phản hồi của người dùng.
 *
 * Vòng đời:
 * 1. AI gợi ý → tạo record (status = PENDING, feedback = null)
 * 2a. Explicit: người dùng bấm like/dislike → feedback = pos/neg, source = explicit, status = RESOLVED
 * 2b. Implicit: người dùng lưu form:
 *     - actualValue === suggestedValue → feedback = POSITIVE, source = implicit, status = RESOLVED
 *     - actualValue !== suggestedValue → feedback = NEGATIVE, source = implicit, status = RESOLVED
 * 3. Không thao tác (cron job) → status = EXPIRED
 */
@Entity('ai_feedbacks')
@Index(['projectId', 'actionType'])
@Index(['userId', 'createdAt'])
export class AiFeedback extends AppBaseEntity {
	// ─── Loại hành động AI ───────────────────────────────────────────────────────

	@Column({ type: 'enum', enum: AiActionType })
	actionType: AiActionType

	// ─── Context: liên kết đến project / task / user ──────────────────────────

	@Column({ type: 'int', nullable: true })
	projectId?: number

	@ManyToOne(() => Project, { nullable: true, onDelete: 'SET NULL', eager: false })
	@JoinColumn({ name: 'projectId' })
	project?: Project

	/**
	 * taskId được điền sau khi task được tạo/cập nhật (dùng cho implicit feedback).
	 * Khi AI gợi ý trong lúc tạo task mới, task chưa tồn tại → để null, cập nhật sau.
	 */
	@Column({ type: 'int', nullable: true })
	taskId?: number

	@ManyToOne(() => Task, { nullable: true, onDelete: 'SET NULL', eager: false })
	@JoinColumn({ name: 'taskId' })
	task?: Task

	@Column({ type: 'int' })
	userId: number

	@ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE', eager: false })
	@JoinColumn({ name: 'userId' })
	user?: User

	// ─── Giá trị gợi ý của AI ────────────────────────────────────────────────────

	/**
	 * Giá trị AI gợi ý, dạng JSON linh hoạt.
	 * Ví dụ: { storyPoint: 5 } | { priority: "HIGH" } | { assigneeId: 3 }
	 */
	@Column({ type: 'jsonb' })
	suggestedValue: Record<string, unknown>

	/**
	 * Giá trị người dùng thực sự lưu (chỉ dùng cho implicit feedback).
	 * So sánh với suggestedValue để suy ra pos/neg.
	 */
	@Column({ type: 'jsonb', nullable: true })
	actualValue?: Record<string, unknown>

	// ─── Kết quả feedback ────────────────────────────────────────────────────────

	@Column({ type: 'enum', enum: FeedbackValue, nullable: true })
	feedback?: FeedbackValue

	@Column({ type: 'enum', enum: FeedbackSource, nullable: true })
	feedbackSource?: FeedbackSource

	@Column({ type: 'enum', enum: FeedbackStatus, default: FeedbackStatus.PENDING })
	status: FeedbackStatus

	/** Bình luận tự do (xuất hiện khi dislike trên UI) */
	@Column({ type: 'text', nullable: true })
	comment?: string

	// ─── Metadata AI ─────────────────────────────────────────────────────────────

	/**
	 * Thông tin về phiên AI: model version, prompt id, confidence score, ...
	 * Ví dụ: { modelVersion: "gpt-4o", confidence: 0.85, promptId: "sp-v2" }
	 */
	@Column({ type: 'jsonb', nullable: true })
	metadata?: Record<string, unknown>
}
