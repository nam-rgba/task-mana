import { getPlanRepository } from '~/repository/plan.repository.js'
import { NotFoundError } from '~/utils/error.reponse.js'

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
}

export const planService = new PlanService()
