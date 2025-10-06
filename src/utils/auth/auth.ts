import jwt from 'jsonwebtoken'
import AsyncHandler from '../async-handler.js'
import { UnauthorizedError } from '../error.reponse.js'
import { Request, Response, NextFunction } from 'express'
import { SessionService } from '~/services/token.service.js'

const HEADER = {
	TOKEN: 'token',
	CLIEANT_ID: 'x-client-id'
}

const sessionService = new SessionService()

const createTokenPair = (payload: any, accessKey: string, refreshKey: string) => {
	try {
		const accessToken = jwt.sign(payload, accessKey, {
			expiresIn: '2 days'
		})
		const refreshToken = jwt.sign(payload, refreshKey, {
			expiresIn: '7 days'
		})

		return { accessToken, refreshToken }
	} catch (err) {
		console.log(err)
	}
}

const authenticate = AsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
	const userId = req.headers[HEADER.CLIEANT_ID]
	if (!userId) throw new UnauthorizedError('Unauthorized, missing client id!')

	const accessToken = req.headers[HEADER.TOKEN]
	if (!accessToken) throw new UnauthorizedError('Unauthorized, missing access token!')

	const foundKey = await sessionService.getAccessKey(Number(userId))
	if (!foundKey) throw new UnauthorizedError('Unauthorized, invalid client!')

	try {
		const decoded = jwt.verify(accessToken as string, foundKey)
		if (userId !== (decoded as any).userId) throw new UnauthorizedError('Unauthorized, invalid user!')

		req.body.user = decoded

		return next()
	} catch (error) {
		throw new Error('authenticate error' + (error as Error).message)
	}
})

export { createTokenPair, authenticate }
