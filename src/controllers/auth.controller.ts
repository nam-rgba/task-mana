import { NextFunction, Request, Response } from 'express'
import { login, register, verifyEmail, getGoogleAuthUrl, googleLogin } from '~/services/auth.service.js'
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

	// Google OAuth - get auth URL
	googleAuth = async (req: Request, res: Response, next: NextFunction) => {
		const url = getGoogleAuthUrl()
		new OKResponse('Google auth URL', 200, { url }).send(res)
	}

	// Google OAuth - callback
	googleCallback = async (req: Request, res: Response, next: NextFunction) => {
		const { code } = req.query
		if (typeof code !== 'string') {
			return next(new BadRequestError('Authorization code is required'))
		}

		const result = await googleLogin(code)
		const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

		const params = new URLSearchParams({
			accessToken: result.token.accessToken,
			refreshToken: result.token.refreshToken,
			userId: String(result.user.id)
		})

		res.redirect(`${frontendUrl}/auth/google/callback?${params.toString()}`)
	}
}

export default new AuthController()
