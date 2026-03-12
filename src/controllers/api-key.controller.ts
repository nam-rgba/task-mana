import { NextFunction, Request, Response } from 'express'
import { apiKeyService } from '~/services/api-key.service.js'
import { BadRequestError } from '~/utils/error.reponse.js'
import { CreatedResponse, OKResponse } from '~/utils/success.response.js'

class ApiKeyController {
	private getUserId(req: Request): number {
		const userId = Number(req.headers['x-user-id'])
		if (!userId) throw new BadRequestError('x-user-id header is required')
		return userId
	}

	create = async (req: Request, res: Response, next: NextFunction) => {
		const userId = this.getUserId(req)
		return new CreatedResponse(
			'Create API key successfully!',
			201,
			await apiKeyService.createApiKey(userId, req.body)
		).send(res)
	}

	getList = async (req: Request, res: Response, next: NextFunction) => {
		const userId = this.getUserId(req)
		return new OKResponse('Get API keys successfully!', 200, await apiKeyService.listApiKeys(userId)).send(res)
	}

	update = async (req: Request, res: Response, next: NextFunction) => {
		const userId = this.getUserId(req)
		const id = Number(req.params.id)
		return new OKResponse(
			'Update API key successfully!',
			200,
			await apiKeyService.updateApiKey(userId, id, req.body)
		).send(res)
	}

	delete = async (req: Request, res: Response, next: NextFunction) => {
		const userId = this.getUserId(req)
		const id = Number(req.params.id)
		return new OKResponse('Delete API key successfully!', 200, await apiKeyService.deleteApiKey(userId, id)).send(res)
	}

	getUsageList = async (req: Request, res: Response, next: NextFunction) => {
		const userId = this.getUserId(req)
		const id = Number(req.params.id)
		const page = req.query.page ? Number(req.query.page) : undefined
		const limit = req.query.limit ? Number(req.query.limit) : undefined
		return new OKResponse(
			'Get usage list successfully!',
			200,
			await apiKeyService.getUsageList(userId, id, page, limit)
		).send(res)
	}

	getUsageOverview = async (req: Request, res: Response, next: NextFunction) => {
		const userId = this.getUserId(req)
		const id = Number(req.params.id)
		return new OKResponse(
			'Get usage overview successfully!',
			200,
			await apiKeyService.getUsageOverview(userId, id)
		).send(res)
	}
}

export const apiKeyController = new ApiKeyController()
