import { NextFunction, Request, Response } from 'express'
import { login, register } from '~/services/auth.service.js'
import { CreatedResponse, OKResponse } from '~/utils/success.response.js'

class AuthController {
	// register
	register = async (req: Request, res: Response, next: NextFunction) => {
		new CreatedResponse('Register successfully', 201, await register(req.body.email, req.body.password)).send(res)
	}

	// login
	login = async (req: Request, res: Response, next: NextFunction) => {
		new OKResponse('Login successfully', 200, await login(req.body.email, req.body.password)).send(res)
	}
}

export default new AuthController()
