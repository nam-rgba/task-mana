import { NextFunction, Request, Response } from 'express'
import { dashboardService } from '~/services/dashboard.service.js'
import { OKResponse } from '~/utils/success.response.js'
import { BadRequestError } from '~/utils/error.reponse.js'

class DashboardController {
	getDashboard = async (req: Request, res: Response, next: NextFunction) => {
		const userId = Number(req.headers['x-user-id'])
		if (!Number.isInteger(userId) || userId <= 0) {
			return next(new BadRequestError('Invalid user ID'))
		}

		const { startAt, endAt, justForMe } = req.query

		// Validate required parameters
		if (!startAt || !endAt) {
			return next(new BadRequestError('startAt and endAt are required'))
		}

		const _startAt = Number(startAt)
		const _endAt = Number(endAt)

		if (!Number.isInteger(_startAt) || !Number.isInteger(_endAt)) {
			return next(new BadRequestError('startAt and endAt must be unix timestamps'))
		}

		if (_startAt >= _endAt) {
			return next(new BadRequestError('startAt must be less than endAt'))
		}

		const _justForMe = justForMe === 'false' ? false : true

		try {
			const data = await dashboardService.getDashboardStats(userId, _startAt, _endAt, _justForMe)
			new OKResponse('Dashboard stats retrieved successfully', 200, data).send(res)
		} catch (error) {
			next(error)
		}
	}
}

export const dashboardController = new DashboardController()
