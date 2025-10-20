import { Request, Response } from 'express'
import { getAllUsers, getUserById, updateUser } from '~/services/user.service.js'
import { SuccessResponse } from '~/utils/success.response.js'

class UserController {
	getAllUsers = async (req: Request, res: Response) => {
		const { page, limit, query, sort } = req.query

		const users = await getAllUsers({
			page: Number(page) || 1,
			limit: Number(limit) || 10,
			query: query as Record<string, any>
		})

		new SuccessResponse({
			message: 'Get users successfully',
			statusCode: 200,
			metadata: users
		}).send(res)
	}

	getProfile = async (req: Request, res: Response) => {
		const userId = req.headers['x-user-id']

		new SuccessResponse({
			message: 'Get user profile successfully',
			statusCode: 200,
			metadata: await getUserById(Number(userId))
		}).send(res)
	}

	updateProfile = async (req: Request, res: Response) => {
		const userId = req.headers['x-user-id']

		new SuccessResponse({
			message: 'Update user profile successfully',
			statusCode: 200,
			metadata: await updateUser(Number(userId), req.body)
		}).send(res)
	}
}

export { UserController }
