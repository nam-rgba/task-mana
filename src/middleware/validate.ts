import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { BadRequestError } from '~/utils/error.reponse.js'

export function validate(schema: z.ZodObject<any, any>) {
	return (req: Request, res: Response, next: NextFunction) => {
		const result = schema.safeParse(req.body)
		if (result.success) {
			req.body = result.data
			next()
		} else {
			throw new BadRequestError(`Invalid request data: ${result.error.message}`)
		}
	}
}
