import { getProjectRepository } from '~/repository/project.repository.js'

class ProjectService {
	private repo = getProjectRepository()

	async getProjects(query: { page?: number; limit?: number; [key: string]: any }) {
		const { page, limit, ...queries } = query
		return await this.repo.findAll({
			page,
			limit,
			query: queries
		})
	}
}

export const projectService = new ProjectService()
