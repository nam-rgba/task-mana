// src/service/task.service.ts
import { getTaskRepository, TaskQuery } from '~/repository/task.repository.js'
import { Task } from '~/model/task.entity.js'
import { TaskStatus, QCReviewStatus } from '~/types/task.type.js'
import { notificationService } from '~/services/notification/notification.service.js'
import { scheduleStatusService } from '~/services/schedule-status.service.js'
import { getTeamMemberRepository } from '~/repository/team-member.repository.js'
import { AppDataSource } from '~/db/data-source.js'
import { User } from '~/model/user.entity.js'
import { BadRequestError, NotFoundError } from '~/utils/error.reponse.js'
import { getSkillRepository } from '~/repository/skill.repository.js'

export class TaskService {
	private repo = getTaskRepository()
	private teamMemberRepo = getTeamMemberRepository()
	private skillRepo = getSkillRepository()

	async getTasks(query: TaskQuery) {
		const { page, limit, ...queries } = query
		return await this.repo.findAllByRawQuery(query)
	}

	async getTaskById(id: number): Promise<Task | null> {
		return this.repo.findOne(id)
	}

	async createTask(data: Partial<Task>, actorUserId?: number): Promise<Task> {
		const task = await this.repo.create(data)
		await this.activateScheduleForTask(task)
		await this.notifyTaskStakeholders(task, 'created', actorUserId)
		return task
	}

	async updateTask(id: number, data: Partial<Task>, actorUserId?: number): Promise<Task | null> {
		const task = await this.repo.update(id, data)
		if (!task) return null

		await this.activateScheduleForTask(task)
		await this.notifyTaskStakeholders(task, 'updated', actorUserId)
		return task
	}

	async deleteTask(id: number): Promise<boolean> {
		return this.repo.remove(id)
	}

	// Gửi request QC - chuyển từ PROCESSING sang WAIT_REVIEW
	async submitForQC(id: number): Promise<Task | null> {
		const task = await this.repo.findOne(id)
		if (!task) {
			throw new Error('Task not found')
		}
		if (task.status !== TaskStatus.Processing) {
			throw new Error('Task must be in PROCESSING status to submit for QC')
		}

		const updatedTask = await this.repo.update(id, { status: TaskStatus.WaitReview })
		await this.activateScheduleForTask(updatedTask)
		return updatedTask
	}

	// QC đánh giá task
	async submitQCReview(
		id: number,
		data: {
			passed: boolean
			score: number
			actualEffort: number
		}
	): Promise<Task | null> {
		const task = await this.repo.findOne(id)
		if (!task) {
			throw new Error('Task not found')
		}
		if (task.status !== TaskStatus.WaitReview) {
			throw new Error('Task must be in WAIT_REVIEW status to submit QC review')
		}

		const newStatus = data.passed ? TaskStatus.Done : TaskStatus.Processing
		const completedAt = data.passed ? Math.floor(Date.now() / 1000) : task.completedAt

		const updatedTask = await this.repo.update(id, {
			qcReviewStatus: data.passed ? QCReviewStatus.Pass : QCReviewStatus.Fail,
			score: data.score,
			actualEffort: data.actualEffort,
			status: newStatus,
			completedAt
		})

		await this.activateScheduleForTask(updatedTask)
		return updatedTask
	}

	private async activateScheduleForTask(task: Task | null) {
		if (!task?.scheduleId || task.status === TaskStatus.Pending) {
			return
		}

		await scheduleStatusService.activateScheduleWhenTaskStarted(task.scheduleId)
	}

	async buildPerformanceReviewPayload(params: { userId: number; teamId: number; fromAt: number; toAt: number }) {
		const { userId, teamId, fromAt, toAt } = params

		if (!Number.isInteger(userId) || userId <= 0) {
			throw new BadRequestError('userId must be a positive integer')
		}

		if (!Number.isInteger(teamId) || teamId <= 0) {
			throw new BadRequestError('teamId must be a positive integer')
		}

		if (!Number.isInteger(fromAt) || fromAt <= 0 || !Number.isInteger(toAt) || toAt <= 0) {
			throw new BadRequestError('fromAt and toAt must be unix timestamp in seconds')
		}

		if (fromAt > toAt) {
			throw new BadRequestError('fromAt must be less than or equal to toAt')
		}

		const membership = await this.teamMemberRepo.findOneByUserAndTeamId(userId, teamId)
		if (!membership || !membership.isActive) {
			throw new BadRequestError('User is not an active member of this team')
		}

		const user = await AppDataSource.getRepository(User).findOne({
			where: { id: userId },
			select: ['id', 'name', 'email', 'position', 'yearOfExperience']
		})

		if (!user) {
			throw new NotFoundError('User not found')
		}

		const tasks = await this.repo.findTasksForPerformanceReview(userId, teamId, fromAt, toAt)
		const skills = await this.skillRepo.getUserSkills(userId)

		return {
			context: {
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					position: user.position || null,
					yearOfExperience: user.yearOfExperience ?? 0,
					skills
				},

				tasks: tasks.map((task) => {
					const completionTimeSeconds =
						task.completedAt && task.startDate && task.completedAt >= task.startDate
							? task.completedAt - task.startDate
							: null

					return {
						id: task.id,
						title: task.title,
						description: task.description || '',
						difficulty: task.priority,
						status: task.status,
						estimateEffort: task.estimateEffort,
						actualEffort: task.actualEffort,
						startDate: task.startDate,
						dueDate: task.dueDate,
						completedAt: task.completedAt,
						completionTimeSeconds,
						comments: (task.comments || []).map((comment) => ({
							authorName: comment.authorName,
							content: comment.content
						}))
					}
				})
			}
		}
	}

	async getTeamPerformanceDashboard(params: { teamId: number; fromAt: number; toAt: number }) {
		const { teamId, fromAt, toAt } = params

		if (!Number.isInteger(teamId) || teamId <= 0) {
			throw new BadRequestError('teamId must be a positive integer')
		}

		if (!Number.isInteger(fromAt) || fromAt <= 0 || !Number.isInteger(toAt) || toAt <= 0) {
			throw new BadRequestError('fromAt and toAt must be unix timestamp in seconds')
		}

		if (fromAt > toAt) {
			throw new BadRequestError('fromAt must be less than or equal to toAt')
		}

		const rows = await this.repo.findTeamPerformanceDashboard(teamId, fromAt, toAt)

		const users = rows.map((row) => {
			const totalTasks = Number(row.totalTasks) || 0
			const completedTasks = Number(row.completedTasks) || 0
			const onTimeCompletedTasks = Number(row.onTimeCompletedTasks) || 0

			const completionRate = totalTasks > 0 ? Number(((completedTasks / totalTasks) * 100).toFixed(2)) : 0
			const onTimeCompletionRate =
				completedTasks > 0 ? Number(((onTimeCompletedTasks / completedTasks) * 100).toFixed(2)) : 0

			return {
				user: {
					id: row.userId,
					name: row.name,
					email: row.email,
					avatar: row.avatar,
					position: row.position,
					skills: Array.isArray(row.skills) ? row.skills : [],
					yearOfExperience: Number(row.yearOfExperience) || 0
				},
				metrics: {
					totalTasks,
					completedTasks,
					onTimeCompletedTasks,
					completionRate,
					onTimeCompletionRate,
					totalStoryPoints: Number(row.totalStoryPoints) || 0,
					storyPointsAchieved: Number(row.storyPointsAchieved) || 0
				}
			}
		})

		const totals = users.reduce(
			(acc, item) => {
				acc.totalTasks += item.metrics.totalTasks
				acc.completedTasks += item.metrics.completedTasks
				acc.onTimeCompletedTasks += item.metrics.onTimeCompletedTasks
				acc.totalStoryPoints += item.metrics.totalStoryPoints
				acc.storyPointsAchieved += item.metrics.storyPointsAchieved
				return acc
			},
			{
				totalTasks: 0,
				completedTasks: 0,
				onTimeCompletedTasks: 0,
				totalStoryPoints: 0,
				storyPointsAchieved: 0
			}
		)

		return {
			period: { fromAt, toAt },
			teamId,
			totals: {
				...totals,
				completionRate:
					totals.totalTasks > 0 ? Number(((totals.completedTasks / totals.totalTasks) * 100).toFixed(2)) : 0,
				onTimeCompletionRate:
					totals.completedTasks > 0
						? Number(((totals.onTimeCompletedTasks / totals.completedTasks) * 100).toFixed(2))
						: 0
			},
			users
		}
	}

	private async notifyTaskStakeholders(task: Task, action: 'created' | 'updated', actorUserId?: number) {
		// Don't notify the actor themselves
		if (task.assigneeId && task.assigneeId !== actorUserId) {
			await notificationService.notifyTaskParticipant({
				recipientUserId: task.assigneeId,
				taskId: task.id,
				taskTitle: task.title,
				action,
				role: 'assignee',
				actorUserId
			})
		}

		if (task.reviewerId && task.reviewerId !== actorUserId) {
			await notificationService.notifyTaskParticipant({
				recipientUserId: task.reviewerId,
				taskId: task.id,
				taskTitle: task.title,
				action,
				role: 'reviewer',
				actorUserId
			})
		}
	}
}

export const taskService = new TaskService()
