import { getTaskRepository } from '~/repository/task.repository.js'

// viết cho tôi dashboard service
class DashboardService {
	private repo = getTaskRepository()
	private tasksCache: Map<string, any> = new Map()

	async getDashboardData(query: { [key: string]: any }) {
		const cacheKey = JSON.stringify(query)
		if (this.tasksCache.has(cacheKey)) {
			console.log('Returning cached dashboard data')
			return this.tasksCache.get(cacheKey)
		}

		console.log('Fetching new dashboard data with query:', query)
		const tasks = await this.repo.findAll({
			query,
			page: 1,
			limit: 100 // Adjust as needed
		})

		this.tasksCache.set(cacheKey, tasks)
		return tasks
	}

	clearCache() {
		this.tasksCache.clear()
	}
}

export const dashboardService = new DashboardService()
export default dashboardService
