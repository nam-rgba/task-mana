/**
 * Các loại hành động AI có thể thực hiện
 */
export enum AiActionType {
	STORY_POINT_SUGGESTION = 'STORY_POINT_SUGGESTION', // AI gợi ý story point cho task
	TASK_GENERATION = 'TASK_GENERATION', // AI sinh task từ mô tả
	TASK_DESCRIPTION = 'TASK_DESCRIPTION', // AI viết mô tả cho task
	PRIORITY_SUGGESTION = 'PRIORITY_SUGGESTION', // AI gợi ý độ ưu tiên
	ASSIGNEE_SUGGESTION = 'ASSIGNEE_SUGGESTION', // AI gợi ý người thực hiện
	TASK_SPLIT = 'TASK_SPLIT', // AI tách task lớn thành subtask
	DUPLICATE_CHECK = 'DUPLICATE_CHECK', // AI kiểm tra task trùng lặp
	OTHER = 'OTHER'
}

/**
 * Kết quả đánh giá: người dùng có hài lòng với gợi ý của AI không
 */
export enum FeedbackValue {
	POSITIVE = 'positive', // Hài lòng / AI đúng
	NEGATIVE = 'negative' // Không hài lòng / AI sai
}

/**
 * Cách feedback được ghi nhận
 */
export enum FeedbackSource {
	EXPLICIT = 'explicit', // Người dùng bấm nút like/dislike trực tiếp
	IMPLICIT = 'implicit' // Suy luận từ hành vi: lưu y chang gợi ý = pos, đổi = neg
}

/**
 * Trạng thái vòng đời của một feedback record
 */
export enum FeedbackStatus {
	PENDING = 'pending', // AI vừa gợi ý, chưa có phản hồi
	RESOLVED = 'resolved', // Đã ghi nhận feedback
	EXPIRED = 'expired' // Hết hạn (người dùng không thao tác)
}
