import { Project } from '~/model/project.entity.js'
import { getProjectRepository } from '~/repository/project.repository.js'
import { getTeamRepository } from '~/repository/team.repository.js'

class ProjectService {
	private repo = getProjectRepository()
	private teamRepository = getTeamRepository()

	async getProjects(query: { page?: number; limit?: number; [key: string]: any }) {
		const { page, limit, ...queries } = query
		return await this.repo.findAll({
			page,
			limit,
			query: queries
		})
	}

	async getProjectAndId() {
		return await this.repo.getAllNameAndId()
	}

	async createProject(projectData: Partial<Project>) {
		const { teamId, ...rest } = projectData
		// check xem team có tồn tại không
		if (teamId) {
			const foundTeam = await this.teamRepository.findOneById(Number(teamId))
			if (!foundTeam) {
				throw new Error(`Team with id ${teamId} not found`)
			}
		}
		const newProject = await this.repo.create(projectData)
		return newProject
	}

	async updateProject(id: number, projectData: Partial<Project>) {
		return await this.repo.update(id, projectData)
	}

	async deleteProject(id: number) {
		return await this.repo.deleteProject(id)
	}
}

export const projectService = new ProjectService()
