import { NextFunction, Request, Response } from 'express'
import { login, register, verifyEmail } from '~/services/auth.service.js'
import { BadRequestError } from '~/utils/error.reponse.js'
import { CreatedResponse, OKResponse } from '~/utils/success.response.js'

class AuthController {
	// register
	register = async (req: Request, res: Response, next: NextFunction) => {
		new CreatedResponse(
			'Register successfully',
			201,
			await register(req.body.email, req.body.name, req.body.password)
		).send(res)
	}

	// login
	login = async (req: Request, res: Response, next: NextFunction) => {
		new OKResponse('Login successfully', 200, await login(req.body.email, req.body.password)).send(res)
	}

	// verifyEmail
	verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
		const { token } = req.query
		if (typeof token !== 'string') {
			return next(new BadRequestError('Token is required'))
		}

		try {
			new OKResponse('Email verified successfully', 200, await verifyEmail(token)).send(res)
		} catch (error) {
			next(error)
		}
	}
}

export default new AuthController()
