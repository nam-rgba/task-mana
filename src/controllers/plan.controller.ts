import { NextFunction, Request, Response } from 'express'
import { planService } from '~/services/plan.service.js'
import { OKResponse } from '~/utils/success.response.js'

class PlanController {
	getAll = async (req: Request, res: Response, next: NextFunction) => {
		return new OKResponse('Get plans successfully!', 200, await planService.getAllPlans()).send(res)
	}

	getById = async (req: Request, res: Response, next: NextFunction) => {
		const planId = Number(req.params.id)
		return new OKResponse('Get plan successfully!', 200, await planService.getPlanById(planId)).send(res)
	}
}

const planController = new PlanController()

export default planController
