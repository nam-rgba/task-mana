import { getProjectRepository } from '~/repository/project.repository.js'
import { getTaskRepository } from '~/repository/task.repository.js'
import { getTeamMemberRepository } from '~/repository/team-member.repository.js'

class AiService {
	private taskRepo = getTaskRepository()
	private memberRepo = getTeamMemberRepository()
	private projectRepo = getProjectRepository()

	constructor() {}

	async getAllTask({ page, limit }: { page?: number; limit?: number }) {
		return await this.taskRepo.findAll({ page, limit })
	}

	async getAllTeamMember({ page, limit }: { page?: number; limit?: number }) {
		return await this.memberRepo.findAll({ page, limit })
	}

	async getAllProject({ page, limit }: { page?: number; limit?: number }) {
		return await this.projectRepo.findAll({ page, limit })
	}
}

export const aiDataService = new AiService()
