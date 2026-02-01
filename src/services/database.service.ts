import { AppDataSource } from '~/db/data-source.js'

export class DatabaseService {
	static async clearAllData() {
		try {
			// Clear data theo thứ tự đúng (child tables trước, parent tables sau)
			const results: Record<string, number> = {}

			// 1. Clear tasks
			const tasksResult = await AppDataSource.query('DELETE FROM tasks')
			results.tasks = tasksResult[1] || 0

			// 2. Clear team_members
			const teamMembersResult = await AppDataSource.query('DELETE FROM team_members')
			results.teamMembers = teamMembersResult[1] || 0

			// 3. Clear projects
			const projectsResult = await AppDataSource.query('DELETE FROM projects')
			results.projects = projectsResult[1] || 0

			// 4. Clear teams
			const teamsResult = await AppDataSource.query('DELETE FROM teams')
			results.teams = teamsResult[1] || 0

			// 5. Clear users
			const usersResult = await AppDataSource.query('DELETE FROM users')
			results.users = usersResult[1] || 0

			// Reset sequences
			await AppDataSource.query('ALTER SEQUENCE tasks_id_seq RESTART WITH 1')
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

	static async exportAllData() {
		try {
			// Export tất cả data từ các bảng theo đúng thứ tự (parent tables trước)
			const users = await AppDataSource.query('SELECT * FROM users ORDER BY id')
			const teams = await AppDataSource.query('SELECT * FROM teams ORDER BY id')
			const teamMembers = await AppDataSource.query('SELECT * FROM team_members ORDER BY id')
			const projects = await AppDataSource.query('SELECT * FROM projects ORDER BY id')
			const tasks = await AppDataSource.query('SELECT * FROM tasks ORDER BY id')

			return {
				success: true,
				message: 'Đã export dữ liệu thành công',
				data: {
					users,
					teams,
					teamMembers,
					projects,
					tasks
				},
				stats: {
					users: users.length,
					teams: teams.length,
					teamMembers: teamMembers.length,
					projects: projects.length,
					tasks: tasks.length
				}
			}
		} catch (error) {
			console.error('Lỗi khi export dữ liệu:', error)
			throw error
		}
	}

	static async importAllData(data: {
		users?: any[]
		teams?: any[]
		teamMembers?: any[]
		projects?: any[]
		tasks?: any[]
	}) {
		try {
			const results: Record<string, number> = {}

			// Import theo thứ tự đúng (parent tables trước)

			// 1. Import users
			if (data.users && data.users.length > 0) {
				for (const user of data.users) {
					await AppDataSource.query(
						`INSERT INTO users (id, email, password, name, avatar, position, "yearOfExperience", "createdAt", "updatedAt") 
						VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
						ON CONFLICT (id) DO UPDATE SET
							email = EXCLUDED.email,
							password = EXCLUDED.password,
							name = EXCLUDED.name,
							avatar = EXCLUDED.avatar,
							position = EXCLUDED.position,
							"yearOfExperience" = EXCLUDED."yearOfExperience",
							"updatedAt" = EXCLUDED."updatedAt"`,
						[
							user.id,
							user.email,
							user.password,
							user.name,
							user.avatar,
							user.position,
							user.yearOfExperience,
							user.createdAt,
							user.updatedAt
						]
					)
				}
				results.users = data.users.length
				// Update sequence
				await AppDataSource.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`)
			}

			// 2. Import teams
			if (data.teams && data.teams.length > 0) {
				for (const team of data.teams) {
					await AppDataSource.query(
						`INSERT INTO teams (id, key, name, description, color, "avatarUrl", "leadId", "isActive", settings, "createdAt", "updatedAt", "deletedAt") 
						VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
						ON CONFLICT (id) DO UPDATE SET
							key = EXCLUDED.key,
							name = EXCLUDED.name,
							description = EXCLUDED.description,
							color = EXCLUDED.color,
							"avatarUrl" = EXCLUDED."avatarUrl",
							"leadId" = EXCLUDED."leadId",
							"isActive" = EXCLUDED."isActive",
							settings = EXCLUDED.settings,
							"updatedAt" = EXCLUDED."updatedAt",
							"deletedAt" = EXCLUDED."deletedAt"`,
						[
							team.id,
							team.key,
							team.name,
							team.description,
							team.color,
							team.avatarUrl,
							team.leadId,
							team.isActive,
							team.settings,
							team.createdAt,
							team.updatedAt,
							team.deletedAt
						]
					)
				}
				results.teams = data.teams.length
				await AppDataSource.query(`SELECT setval('teams_id_seq', (SELECT MAX(id) FROM teams))`)
			}

			// 3. Import team_members
			if (data.teamMembers && data.teamMembers.length > 0) {
				for (const member of data.teamMembers) {
					await AppDataSource.query(
						`INSERT INTO team_members (id, "userId", "teamId", role, "isActive", "joinedAt", "createdAt", "updatedAt") 
						VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
						ON CONFLICT (id) DO UPDATE SET
							"userId" = EXCLUDED."userId",
							"teamId" = EXCLUDED."teamId",
							role = EXCLUDED.role,
							"isActive" = EXCLUDED."isActive",
							"joinedAt" = EXCLUDED."joinedAt",
							"updatedAt" = EXCLUDED."updatedAt"`,
						[
							member.id,
							member.userId,
							member.teamId,
							member.role,
							member.isActive,
							member.joinedAt,
							member.createdAt,
							member.updatedAt
						]
					)
				}
				results.teamMembers = data.teamMembers.length
				await AppDataSource.query(`SELECT setval('team_members_id_seq', (SELECT MAX(id) FROM team_members))`)
			}

			// 4. Import projects
			if (data.projects && data.projects.length > 0) {
				for (const project of data.projects) {
					await AppDataSource.query(
						`INSERT INTO projects (id, name, description, status, "startDate", "endDate", "leadId", "teamId", "createdAt", "updatedAt") 
						VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
						ON CONFLICT (id) DO UPDATE SET
							name = EXCLUDED.name,
							description = EXCLUDED.description,
							status = EXCLUDED.status,
							"startDate" = EXCLUDED."startDate",
							"endDate" = EXCLUDED."endDate",
							"leadId" = EXCLUDED."leadId",
							"teamId" = EXCLUDED."teamId",
							"updatedAt" = EXCLUDED."updatedAt"`,
						[
							project.id,
							project.name,
							project.description,
							project.status,
							project.startDate,
							project.endDate,
							project.leadId,
							project.teamId,
							project.createdAt,
							project.updatedAt
						]
					)
				}
				results.projects = data.projects.length
				await AppDataSource.query(`SELECT setval('projects_id_seq', (SELECT MAX(id) FROM projects))`)
			}

			// 5. Import tasks
			if (data.tasks && data.tasks.length > 0) {
				for (const task of data.tasks) {
					await AppDataSource.query(
						`INSERT INTO tasks (id, title, description, status, type, "projectId", priority, "estimateEffort", "actualEffort", score, "assigneeId", "reviewerId", "dueDate", "completedAt", "qcReviewStatus", "qcNote", "completedPercent", "created_at", "updated_at") 
						VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
						ON CONFLICT (id) DO UPDATE SET
							title = EXCLUDED.title,
							description = EXCLUDED.description,
							status = EXCLUDED.status,
							type = EXCLUDED.type,
							"projectId" = EXCLUDED."projectId",
							priority = EXCLUDED.priority,
							"estimateEffort" = EXCLUDED."estimateEffort",
							"actualEffort" = EXCLUDED."actualEffort",
							score = EXCLUDED.score,
							"assigneeId" = EXCLUDED."assigneeId",
							"reviewerId" = EXCLUDED."reviewerId",
							"dueDate" = EXCLUDED."dueDate",
							"completedAt" = EXCLUDED."completedAt",
							"qcReviewStatus" = EXCLUDED."qcReviewStatus",
							"qcNote" = EXCLUDED."qcNote",
							"completedPercent" = EXCLUDED."completedPercent",
							"updated_at" = EXCLUDED."updated_at"`,
						[
							task.id,
							task.title,
							task.description,
							task.status,
							task.type,
							task.projectId,
							task.priority,
							task.estimateEffort,
							task.actualEffort,
							task.score,
							task.assigneeId,
							task.reviewerId,
							task.dueDate,
							task.completedAt,
							task.qcReviewStatus,
							task.qcNote,
							task.completedPercent,
							task.created_at,
							task.updated_at
						]
					)
				}
				results.tasks = data.tasks.length
				await AppDataSource.query(`SELECT setval('tasks_id_seq', (SELECT MAX(id) FROM tasks))`)
			}

			return {
				success: true,
				message: 'Đã import dữ liệu thành công',
				imported: results
			}
		} catch (error) {
			console.error('Lỗi khi import dữ liệu:', error)
			throw error
		}
	}
}
