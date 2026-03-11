import { NextFunction, Request, Response } from 'express'
import { notificationService } from '~/services/notification/notification.service.js'
import { BadRequestError } from '~/utils/error.reponse.js'
import { SuccessResponse } from '~/utils/success.response.js'

class NotificationController {
	private getUserIdFromHeaders(req: Request) {
		const userId = Number(req.headers['x-user-id'])
		if (!userId || Number.isNaN(userId)) {
			throw new BadRequestError('x-user-id header is required')
		}

		return userId
	}

	getNotifications = async (req: Request, res: Response, next: NextFunction) => {
		const userId = this.getUserIdFromHeaders(req)
		const page = Number(req.query.page) || 1
		const limit = Number(req.query.limit) || 10

		new SuccessResponse({
			message: 'Get notifications successfully!',
			statusCode: 200,
			metadata: await notificationService.getNotifications(userId, page, limit)
		}).send(res)
	}

	markAsRead = async (req: Request, res: Response, next: NextFunction) => {
		const userId = this.getUserIdFromHeaders(req)
		const id = Number(req.params.id)

		new SuccessResponse({
			message: 'Mark notification as read successfully!',
			statusCode: 200,
			metadata: await notificationService.markAsRead(id, userId)
		}).send(res)
	}
}

export const notificationController = new NotificationController()
