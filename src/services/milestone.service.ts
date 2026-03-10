import { CreateMilestoneDto, UpdateMilestoneDto } from '~/model/dto/gantt.dto.js'
import { Milestone } from '~/model/milestone.entity.js'
import { getMilestoneRepository } from '~/repository/milestone.repository.js'
import { getProjectRepository } from '~/repository/project.repository.js'
import { NotFoundError } from '~/utils/error.reponse.js'

class MilestoneService {
	private milestoneRepo = getMilestoneRepository()
	private projectRepo = getProjectRepository()

	async getByProject(projectId: number) {
		const project = await this.projectRepo.findOneById(projectId)
		if (!project) throw new NotFoundError(`Project with id ${projectId} not found`)
		return await this.milestoneRepo.findByProject(projectId)
	}

	async create(projectId: number, data: CreateMilestoneDto) {
		const project = await this.projectRepo.findOneById(projectId)
		if (!project) throw new NotFoundError(`Project with id ${projectId} not found`)

		return await this.milestoneRepo.create({
			...data,
			projectId
		})
	}

	async update(projectId: number, id: number, data: UpdateMilestoneDto) {
		const milestone = await this.milestoneRepo.findOneById(id)
		if (!milestone || milestone.projectId !== projectId) {
			throw new NotFoundError(`Milestone with id ${id} not found in project ${projectId}`)
		}
		return await this.milestoneRepo.update(id, data as Partial<Milestone>)
	}

	async delete(projectId: number, id: number) {
		const milestone = await this.milestoneRepo.findOneById(id)
		if (!milestone || milestone.projectId !== projectId) {
			throw new NotFoundError(`Milestone with id ${id} not found in project ${projectId}`)
		}
		return await this.milestoneRepo.remove(id)
	}
}

export const milestoneService = new MilestoneService()
