import { NextFunction, Request, Response } from 'express'
import { planService } from '~/services/plan.service.js'
import { OKResponse } from '~/utils/success.response.js'
import { CreatePlanDto } from '~/model/dto/plan.dto.js'

class PlanController {
	getAll = async (req: Request, res: Response, next: NextFunction) => {
		return new OKResponse('Get plans successfully!', 200, await planService.getAllPlans()).send(res)
	}

	getById = async (req: Request, res: Response, next: NextFunction) => {
		const planId = Number(req.params.id)
		return new OKResponse('Get plan successfully!', 200, await planService.getPlanById(planId)).send(res)
	}

	create = async (req: Request, res: Response, next: NextFunction) => {
		const data: CreatePlanDto = req.body
		const plan = await planService.createPlan(data)
		return new OKResponse('Create plan successfully!', 201, plan).send(res)
	}
}

const planController = new PlanController()

export default planController
