import { AppDataSource } from '~/db/data-source.js'

export class DatabaseService {
	static async clearAllData() {
		try {
			// Clear data theo thứ tự đúng (child tables trước, parent tables sau)
			const results: Record<string, number> = {}

			// 1. Clear tasks
			const tasksResult = await AppDataSource.query('DELETE FROM tasks')
			results.tasks = tasksResult[1] || 0

			// 2. Clear tokens
			const tokensResult = await AppDataSource.query('DELETE FROM tokens')
			results.tokens = tokensResult[1] || 0

			// 3. Clear team_members
			const teamMembersResult = await AppDataSource.query('DELETE FROM team_members')
			results.teamMembers = teamMembersResult[1] || 0

			// 4. Clear projects
			const projectsResult = await AppDataSource.query('DELETE FROM projects')
			results.projects = projectsResult[1] || 0

			// 5. Clear teams
			const teamsResult = await AppDataSource.query('DELETE FROM teams')
			results.teams = teamsResult[1] || 0

			// 6. Clear users
			const usersResult = await AppDataSource.query('DELETE FROM users')
			results.users = usersResult[1] || 0

			// Reset sequences
			await AppDataSource.query('ALTER SEQUENCE tasks_id_seq RESTART WITH 1')
			await AppDataSource.query('ALTER SEQUENCE tokens_id_seq RESTART WITH 1')
			await AppDataSource.query('ALTER SEQUENCE team_members_id_seq RESTART WITH 1')
			await AppDataSource.query('ALTER SEQUENCE projects_id_seq RESTART WITH 1')
			await AppDataSource.query('ALTER SEQUENCE teams_id_seq RESTART WITH 1')
			await AppDataSource.query('ALTER SEQUENCE users_id_seq RESTART WITH 1')

			return {
				success: true,
				message: 'Đã xóa tất cả dữ liệu thành công',
				deleted: results
			}
		} catch (error) {
			console.error('Lỗi khi xóa dữ liệu:', error)
			throw error
		}
	}
}
