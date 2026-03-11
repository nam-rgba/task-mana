import { Project } from '~/model/project.entity.js'
import { Task } from '~/model/task.entity.js'
import { AppDataSource } from '~/db/data-source.js'
import { getProjectRepository } from '~/repository/project.repository.js'
import { getTeamRepository } from '~/repository/team.repository.js'
import { NotFoundError } from '~/utils/error.reponse.js'

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

	async getProjectById(id: number) {
		const project = await this.repo.findOneWithSchedules(id)
		if (!project) {
			throw new NotFoundError(`Project with id ${id} not found`)
		}

		const taskRepo = AppDataSource.getRepository(Task)

		const statusCounts: { status: string; count: string }[] = await taskRepo
			.createQueryBuilder('task')
			.select('task.status', 'status')
			.addSelect('COUNT(*)', 'count')
			.where('task.projectId = :id', { id })
			.groupBy('task.status')
			.getRawMany()

		const done = Number(statusCounts.find((s) => s.status === 'DONE')?.count ?? 0)
		const processing = Number(statusCounts.find((s) => s.status === 'PROCESSING')?.count ?? 0)
		const waitReview = Number(statusCounts.find((s) => s.status === 'WAIT_REVIEW')?.count ?? 0)
		const pending = Number(statusCounts.find((s) => s.status === 'PENDING')?.count ?? 0)
		const totalTasks = done + processing + waitReview + pending
		const completionPercent = totalTasks > 0 ? Math.round((done / totalTasks) * 100) : 0

		return {
			...project,
			progress: {
				totalTasks,
				completionPercent,
				done,
				processing,
				waitReview,
				pending
			}
		}
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
