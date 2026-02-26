import { NextFunction, Request, Response } from 'express'
import { aiFeedbackService } from '~/services/ai/ai-feedback.service.js'
import { SuccessResponse } from '~/utils/success.response.js'
import { AiFeedbackQuery } from '~/types/ai-feedback.type.js'

class AiFeedbackController {
	/**
	 * GET /ai-feedback
	 * Lấy danh sách feedback với filter (dùng cho dashboard / admin)
	 */
	getList = async (req: Request, res: Response, next: NextFunction) => {
		const query = req.query as unknown as AiFeedbackQuery
		new SuccessResponse({
			message: 'Get AI feedback list successfully',
			statusCode: 200,
			metadata: await aiFeedbackService.getList(query)
		}).send(res)
	}

	/**
	 * GET /ai-feedback/:id
	 */
	getById = async (req: Request, res: Response, next: NextFunction) => {
		const id = Number(req.params.id)
		new SuccessResponse({
			message: 'Get AI feedback successfully',
			statusCode: 200,
			metadata: await aiFeedbackService.getById(id)
		}).send(res)
	}

	/**
	 * GET /ai-feedback/project/:projectId/summary
	 * Dashboard tổng hợp tỉ lệ chấp nhận AI theo project
	 */
	getProjectSummary = async (req: Request, res: Response, next: NextFunction) => {
		const projectId = Number(req.params.projectId)
		new SuccessResponse({
			message: 'Get project AI feedback summary successfully',
			statusCode: 200,
			metadata: await aiFeedbackService.getProjectSummary(projectId)
		}).send(res)
	}

	/**
	 * PATCH /ai-feedback/:id/explicit
	 * Người dùng bấm like/dislike trực tiếp trên UI
	 * Body: { feedback: 'positive' | 'negative', comment?: string }
	 */
	submitExplicit = async (req: Request, res: Response, next: NextFunction) => {
		const id = Number(req.params.id)
		new SuccessResponse({
			message: 'Explicit feedback submitted successfully',
			statusCode: 200,
			metadata: await aiFeedbackService.submitExplicit(id, req.body)
		}).send(res)
	}

	/**
	 * PATCH /ai-feedback/implicit
	 * Implicit feedback: gửi khi người dùng lưu form có gợi ý AI.
	 * Body: { feedbackId, actualValue, taskId? }
	 *
	 * Lưu ý: endpoint này cũng được gọi nội bộ từ TaskService, không cần
	 * frontend gọi trực tiếp nếu backend xử lý trong task create/update.
	 */
	submitImplicit = async (req: Request, res: Response, next: NextFunction) => {
		new SuccessResponse({
			message: 'Implicit feedback submitted successfully',
			statusCode: 200,
			metadata: await aiFeedbackService.submitImplicit(req.body)
		}).send(res)
	}
}

export default new AiFeedbackController()
