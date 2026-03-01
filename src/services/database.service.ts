import { AppDataSource } from '~/db/data-source.js'

export class DatabaseService {
	static async clearAllData() {
		try {
			// Clear data theo thứ tự đúng (child tables trước, parent tables sau)
			const results: Record<string, number> = {}

			// 1. Clear payment_histories (depends on orders)
			const paymentHistoriesResult = await AppDataSource.query('DELETE FROM payment_histories')
			results.paymentHistories = paymentHistoriesResult[1] || 0

			// 2. Clear orders (depends on users, plans)
			const ordersResult = await AppDataSource.query('DELETE FROM orders')
			results.orders = ordersResult[1] || 0

			// 3. Clear subscriptions (depends on users, plans)
			const subscriptionsResult = await AppDataSource.query('DELETE FROM subscriptions')
			results.subscriptions = subscriptionsResult[1] || 0

			// 4. Clear ai_feedbacks (depends on users, projects, tasks)
			const aiFeedbacksResult = await AppDataSource.query('DELETE FROM ai_feedbacks')
			results.aiFeedbacks = aiFeedbacksResult[1] || 0

			// 5. Clear tokens (depends on users)
			const tokensResult = await AppDataSource.query('DELETE FROM token')
			results.tokens = tokensResult[1] || 0

			// 6. Clear tasks
			const tasksResult = await AppDataSource.query('DELETE FROM tasks')
			results.tasks = tasksResult[1] || 0

			// 7. Clear team_members
			const teamMembersResult = await AppDataSource.query('DELETE FROM team_members')
			results.teamMembers = teamMembersResult[1] || 0

			// 8. Clear projects
			const projectsResult = await AppDataSource.query('DELETE FROM projects')
			results.projects = projectsResult[1] || 0

			// 9. Clear teams
			const teamsResult = await AppDataSource.query('DELETE FROM teams')
			results.teams = teamsResult[1] || 0

			// 10. Clear plans
			const plansResult = await AppDataSource.query('DELETE FROM plans')
			results.plans = plansResult[1] || 0

			// 11. Clear users
			const usersResult = await AppDataSource.query('DELETE FROM users')
			results.users = usersResult[1] || 0

			// Reset sequences
			await AppDataSource.query('ALTER SEQUENCE IF EXISTS payment_histories_id_seq RESTART WITH 1')
			await AppDataSource.query('ALTER SEQUENCE IF EXISTS orders_id_seq RESTART WITH 1')
			await AppDataSource.query('ALTER SEQUENCE IF EXISTS subscriptions_id_seq RESTART WITH 1')
			await AppDataSource.query('ALTER SEQUENCE IF EXISTS ai_feedbacks_id_seq RESTART WITH 1')
			await AppDataSource.query('ALTER SEQUENCE IF EXISTS token_id_seq RESTART WITH 1')
			await AppDataSource.query('ALTER SEQUENCE IF EXISTS tasks_id_seq RESTART WITH 1')
			await AppDataSource.query('ALTER SEQUENCE IF EXISTS team_members_id_seq RESTART WITH 1')
			await AppDataSource.query('ALTER SEQUENCE IF EXISTS projects_id_seq RESTART WITH 1')
			await AppDataSource.query('ALTER SEQUENCE IF EXISTS teams_id_seq RESTART WITH 1')
			await AppDataSource.query('ALTER SEQUENCE IF EXISTS plans_id_seq RESTART WITH 1')
			await AppDataSource.query('ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1')

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
			const plans = await AppDataSource.query('SELECT * FROM plans ORDER BY id')
			const teams = await AppDataSource.query('SELECT * FROM teams ORDER BY id')
			const teamMembers = await AppDataSource.query('SELECT * FROM team_members ORDER BY id')
			const projects = await AppDataSource.query('SELECT * FROM projects ORDER BY id')
			const tasks = await AppDataSource.query('SELECT * FROM tasks ORDER BY id')
			const aiFeedbacks = await AppDataSource.query('SELECT * FROM ai_feedbacks ORDER BY id')
			const orders = await AppDataSource.query('SELECT * FROM orders ORDER BY id')
			const subscriptions = await AppDataSource.query('SELECT * FROM subscriptions ORDER BY id')
			const paymentHistories = await AppDataSource.query('SELECT * FROM payment_histories ORDER BY id')
			const tokens = await AppDataSource.query('SELECT * FROM token ORDER BY id')

			return {
				success: true,
				message: 'Đã export dữ liệu thành công',
				data: {
					users,
					plans,
					teams,
					teamMembers,
					projects,
					tasks,
					aiFeedbacks,
					orders,
					subscriptions,
					paymentHistories,
					tokens
				},
				stats: {
					users: users.length,
					plans: plans.length,
					teams: teams.length,
					teamMembers: teamMembers.length,
					projects: projects.length,
					tasks: tasks.length,
					aiFeedbacks: aiFeedbacks.length,
					orders: orders.length,
					subscriptions: subscriptions.length,
					paymentHistories: paymentHistories.length,
					tokens: tokens.length
				}
			}
		} catch (error) {
			console.error('Lỗi khi export dữ liệu:', error)
			throw error
		}
	}

	static async importAllData(data: {
		users?: any[]
		plans?: any[]
		teams?: any[]
		teamMembers?: any[]
		projects?: any[]
		tasks?: any[]
		aiFeedbacks?: any[]
		orders?: any[]
		subscriptions?: any[]
		paymentHistories?: any[]
		tokens?: any[]
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
				await AppDataSource.query(`SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users))`)
			}

			// 2. Import plans
			if (data.plans && data.plans.length > 0) {
				for (const plan of data.plans) {
					await AppDataSource.query(
						`INSERT INTO plans (id, name, "displayName", description, "monthlyPrice", "yearlyPrice", "maxMembers", "maxProjects", "maxStorage", features, "isActive", "createdAt", "updatedAt", "deletedAt") 
						VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
						ON CONFLICT (id) DO UPDATE SET
							name = EXCLUDED.name,
							"displayName" = EXCLUDED."displayName",
							description = EXCLUDED.description,
							"monthlyPrice" = EXCLUDED."monthlyPrice",
							"yearlyPrice" = EXCLUDED."yearlyPrice",
							"maxMembers" = EXCLUDED."maxMembers",
							"maxProjects" = EXCLUDED."maxProjects",
							"maxStorage" = EXCLUDED."maxStorage",
							features = EXCLUDED.features,
							"isActive" = EXCLUDED."isActive",
							"updatedAt" = EXCLUDED."updatedAt",
							"deletedAt" = EXCLUDED."deletedAt"`,
						[
							plan.id,
							plan.name,
							plan.displayName,
							plan.description,
							plan.monthlyPrice,
							plan.yearlyPrice,
							plan.maxMembers,
							plan.maxProjects,
							plan.maxStorage,
							JSON.stringify(plan.features),
							plan.isActive,
							plan.createdAt,
							plan.updatedAt,
							plan.deletedAt
						]
					)
				}
				results.plans = data.plans.length
				await AppDataSource.query(`SELECT setval('plans_id_seq', (SELECT COALESCE(MAX(id), 1) FROM plans))`)
			}

			// 3. Import teams
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
				await AppDataSource.query(`SELECT setval('teams_id_seq', (SELECT COALESCE(MAX(id), 1) FROM teams))`)
			}

			// 4. Import team_members
			if (data.teamMembers && data.teamMembers.length > 0) {
				for (const member of data.teamMembers) {
					await AppDataSource.query(
						`INSERT INTO team_members (id, "userId", "teamId", role, "isActive", "createdAt", "updatedAt", "deletedAt") 
						VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
						ON CONFLICT (id) DO UPDATE SET
							"userId" = EXCLUDED."userId",
							"teamId" = EXCLUDED."teamId",
							role = EXCLUDED.role,
							"isActive" = EXCLUDED."isActive",
							"updatedAt" = EXCLUDED."updatedAt",
							"deletedAt" = EXCLUDED."deletedAt"`,
						[
							member.id,
							member.userId,
							member.teamId,
							member.role,
							member.isActive,
							member.createdAt,
							member.updatedAt,
							member.deletedAt
						]
					)
				}
				results.teamMembers = data.teamMembers.length
				await AppDataSource.query(
					`SELECT setval('team_members_id_seq', (SELECT COALESCE(MAX(id), 1) FROM team_members))`
				)
			}

			// 5. Import projects
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
				await AppDataSource.query(`SELECT setval('projects_id_seq', (SELECT COALESCE(MAX(id), 1) FROM projects))`)
			}

			// 6. Import tasks
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
				await AppDataSource.query(`SELECT setval('tasks_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tasks))`)
			}

			// 7. Import ai_feedbacks
			if (data.aiFeedbacks && data.aiFeedbacks.length > 0) {
				for (const fb of data.aiFeedbacks) {
					await AppDataSource.query(
						`INSERT INTO ai_feedbacks (id, "actionType", "projectId", "taskId", "userId", "suggestedValue", "actualValue", feedback, "feedbackSource", status, comment, metadata, "createdAt", "updatedAt", "deletedAt") 
						VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
						ON CONFLICT (id) DO UPDATE SET
							"actionType" = EXCLUDED."actionType",
							"projectId" = EXCLUDED."projectId",
							"taskId" = EXCLUDED."taskId",
							"userId" = EXCLUDED."userId",
							"suggestedValue" = EXCLUDED."suggestedValue",
							"actualValue" = EXCLUDED."actualValue",
							feedback = EXCLUDED.feedback,
							"feedbackSource" = EXCLUDED."feedbackSource",
							status = EXCLUDED.status,
							comment = EXCLUDED.comment,
							metadata = EXCLUDED.metadata,
							"updatedAt" = EXCLUDED."updatedAt",
							"deletedAt" = EXCLUDED."deletedAt"`,
						[
							fb.id,
							fb.actionType,
							fb.projectId,
							fb.taskId,
							fb.userId,
							JSON.stringify(fb.suggestedValue),
							fb.actualValue ? JSON.stringify(fb.actualValue) : null,
							fb.feedback,
							fb.feedbackSource,
							fb.status,
							fb.comment,
							fb.metadata ? JSON.stringify(fb.metadata) : null,
							fb.createdAt,
							fb.updatedAt,
							fb.deletedAt
						]
					)
				}
				results.aiFeedbacks = data.aiFeedbacks.length
				await AppDataSource.query(
					`SELECT setval('ai_feedbacks_id_seq', (SELECT COALESCE(MAX(id), 1) FROM ai_feedbacks))`
				)
			}

			// 8. Import orders
			if (data.orders && data.orders.length > 0) {
				for (const order of data.orders) {
					await AppDataSource.query(
						`INSERT INTO orders (id, "orderCode", "userId", "planId", amount, "billingCycle", status, "vnpTxnRef", "vnpTransactionNo", "vnpResponseCode", "vnpPayDate", "paidAt", "createdAt", "updatedAt", "deletedAt") 
						VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
						ON CONFLICT (id) DO UPDATE SET
							"orderCode" = EXCLUDED."orderCode",
							"userId" = EXCLUDED."userId",
							"planId" = EXCLUDED."planId",
							amount = EXCLUDED.amount,
							"billingCycle" = EXCLUDED."billingCycle",
							status = EXCLUDED.status,
							"vnpTxnRef" = EXCLUDED."vnpTxnRef",
							"vnpTransactionNo" = EXCLUDED."vnpTransactionNo",
							"vnpResponseCode" = EXCLUDED."vnpResponseCode",
							"vnpPayDate" = EXCLUDED."vnpPayDate",
							"paidAt" = EXCLUDED."paidAt",
							"updatedAt" = EXCLUDED."updatedAt",
							"deletedAt" = EXCLUDED."deletedAt"`,
						[
							order.id,
							order.orderCode,
							order.userId,
							order.planId,
							order.amount,
							order.billingCycle,
							order.status,
							order.vnpTxnRef,
							order.vnpTransactionNo,
							order.vnpResponseCode,
							order.vnpPayDate,
							order.paidAt,
							order.createdAt,
							order.updatedAt,
							order.deletedAt
						]
					)
				}
				results.orders = data.orders.length
				await AppDataSource.query(`SELECT setval('orders_id_seq', (SELECT COALESCE(MAX(id), 1) FROM orders))`)
			}

			// 9. Import subscriptions
			if (data.subscriptions && data.subscriptions.length > 0) {
				for (const sub of data.subscriptions) {
					await AppDataSource.query(
						`INSERT INTO subscriptions (id, "userId", "planId", "billingCycle", "startDate", "endDate", status, "autoRenew", "createdAt", "updatedAt", "deletedAt") 
						VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
						ON CONFLICT (id) DO UPDATE SET
							"userId" = EXCLUDED."userId",
							"planId" = EXCLUDED."planId",
							"billingCycle" = EXCLUDED."billingCycle",
							"startDate" = EXCLUDED."startDate",
							"endDate" = EXCLUDED."endDate",
							status = EXCLUDED.status,
							"autoRenew" = EXCLUDED."autoRenew",
							"updatedAt" = EXCLUDED."updatedAt",
							"deletedAt" = EXCLUDED."deletedAt"`,
						[
							sub.id,
							sub.userId,
							sub.planId,
							sub.billingCycle,
							sub.startDate,
							sub.endDate,
							sub.status,
							sub.autoRenew,
							sub.createdAt,
							sub.updatedAt,
							sub.deletedAt
						]
					)
				}
				results.subscriptions = data.subscriptions.length
				await AppDataSource.query(
					`SELECT setval('subscriptions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM subscriptions))`
				)
			}

			// 10. Import payment_histories
			if (data.paymentHistories && data.paymentHistories.length > 0) {
				for (const ph of data.paymentHistories) {
					await AppDataSource.query(
						`INSERT INTO payment_histories (id, "orderId", "userId", action, "rawData", "ipAddress", "createdAt", "updatedAt", "deletedAt") 
						VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
						ON CONFLICT (id) DO UPDATE SET
							"orderId" = EXCLUDED."orderId",
							"userId" = EXCLUDED."userId",
							action = EXCLUDED.action,
							"rawData" = EXCLUDED."rawData",
							"ipAddress" = EXCLUDED."ipAddress",
							"updatedAt" = EXCLUDED."updatedAt",
							"deletedAt" = EXCLUDED."deletedAt"`,
						[
							ph.id,
							ph.orderId,
							ph.userId,
							ph.action,
							ph.rawData ? JSON.stringify(ph.rawData) : null,
							ph.ipAddress,
							ph.createdAt,
							ph.updatedAt,
							ph.deletedAt
						]
					)
				}
				results.paymentHistories = data.paymentHistories.length
				await AppDataSource.query(
					`SELECT setval('payment_histories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM payment_histories))`
				)
			}

			// 11. Import tokens
			if (data.tokens && data.tokens.length > 0) {
				for (const token of data.tokens) {
					await AppDataSource.query(
						`INSERT INTO token (id, "userId", "accessKey", "refreshKey", "refreshToken", "createdAt", "updatedAt") 
						VALUES ($1, $2, $3, $4, $5, $6, $7)
						ON CONFLICT (id) DO UPDATE SET
							"userId" = EXCLUDED."userId",
							"accessKey" = EXCLUDED."accessKey",
							"refreshKey" = EXCLUDED."refreshKey",
							"refreshToken" = EXCLUDED."refreshToken",
							"updatedAt" = EXCLUDED."updatedAt"`,
						[
							token.id,
							token.userId,
							token.accessKey,
							token.refreshKey,
							token.refreshToken,
							token.createdAt,
							token.updatedAt
						]
					)
				}
				results.tokens = data.tokens.length
				await AppDataSource.query(`SELECT setval('token_id_seq', (SELECT COALESCE(MAX(id), 1) FROM token))`)
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
