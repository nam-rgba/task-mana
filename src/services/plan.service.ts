import { getPlanRepository } from '~/repository/plan.repository.js'
import { NotFoundError } from '~/utils/error.reponse.js'
import { CreatePlanDto } from '~/model/dto/plan.dto.js'
import { BadRequestError } from '~/utils/error.reponse.js'

class PlanService {
	private repo = getPlanRepository()

	async getAllPlans() {
		return await this.repo.findAll()
	}

	async getPlanById(id: number) {
		const plan = await this.repo.findOneById(id)
		if (!plan) throw new NotFoundError('Plan not found')
		return plan
	}

	async createPlan(data: CreatePlanDto) {
		// Check if plan with same name already exists
		const existingPlan = await this.repo.findOneByName(data.name)
		if (existingPlan) {
			throw new BadRequestError('Plan with this name already exists')
		}

		return await this.repo.create(data)
	}
}

export const planService = new PlanService()
