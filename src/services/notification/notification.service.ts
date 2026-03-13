import { getNotificationRepository } from '~/repository/notification.repository.js'
import { getUserRepository } from '~/repository/user.repository.js'
import { NotFoundError } from '~/utils/error.reponse.js'
import { notificationWsService } from './notification-ws.service.js'
import { renderTaskNotificationContent } from './notification-template.service.js'
import { sendTaskNotificationEmail } from '~/services/email/task-email.service.js'
import { sendBulkProjectAssignmentEmail } from '~/services/email/bulk-project-assignment-email.service.js'

export type TaskNotifyAction = 'created' | 'updated'
export type TaskNotifyRole = 'assignee' | 'reviewer'

interface CreateNotificationInput {
	userId: number
	type: string
	title: string
	content: string
	metadata?: Record<string, any>
}

interface NotifyTaskParticipantInput {
	recipientUserId: number
	taskId: number
	taskTitle: string
	action: TaskNotifyAction
	role: TaskNotifyRole
	actorUserId?: number
}

interface NotifyBulkProjectAssignmentInput {
	recipientUserId: number
	projectId: number
	projectName: string
	taskCount: number
}

class NotificationService {
	private notificationRepo = getNotificationRepository()
	private userRepo = getUserRepository()

	async createNotification(input: CreateNotificationInput) {
		const notification = await this.notificationRepo.create({
			userId: input.userId,
			type: input.type,
			title: input.title,
			content: input.content,
			metadata: input.metadata,
			isRead: false
		})

		notificationWsService.sendToUser(input.userId, {
			event: 'notifications:new',
			data: notification
		})

		return notification
	}

	async getNotifications(userId: number, page = 1, limit = 10) {
		return await this.notificationRepo.findByUser(userId, { page, limit })
	}

	async markAsRead(id: number, userId: number) {
		const found = await this.notificationRepo.findOneByIdAndUser(id, userId)
		if (!found) throw new NotFoundError('Notification not found')

		if (found.isRead) return found

		return await this.notificationRepo.update(found.id, {
			isRead: true,
			readAt: new Date()
		})
	}

	async notifyTaskParticipant(input: NotifyTaskParticipantInput) {
		const recipient = await this.userRepo.findOne({ id: input.recipientUserId })
		if (!recipient?.id) return null

		const actor = input.actorUserId ? await this.userRepo.findOne({ id: input.actorUserId }) : null
		const actorName = actor?.name || 'A teammate'

		const actionText = input.action === 'created' ? 'tạo' : 'cập nhật'
		const roleText = input.role === 'reviewer' ? 'reviewer' : 'người phụ trách'
		const title = `Task được ${actionText}: ${input.taskTitle}`
		const content = renderTaskNotificationContent({
			actorName,
			actionText,
			taskTitle: input.taskTitle,
			roleText
		})

		const notification = await this.createNotification({
			userId: recipient.id,
			type: `TASK_${input.action.toUpperCase()}_${input.role.toUpperCase()}`,
			title,
			content,
			metadata: {
				taskId: input.taskId,
				action: input.action,
				role: input.role
			}
		})

		if (recipient.email) {
			await sendTaskNotificationEmail({
				userId: recipient.id,
				toEmail: recipient.email,
				subject: title,
				notificationId: notification.id,
				templateData: {
					recipientName: recipient.name || 'there',
					actorName,
					taskTitle: input.taskTitle,
					actionText,
					roleText,
					taskId: input.taskId,
					frontendUrl: process.env.FRONTEND_URL
				}
			})
		}

		return notification
	}

	async notifyBulkProjectAssignment(input: NotifyBulkProjectAssignmentInput) {
		const recipient = await this.userRepo.findOne({ id: input.recipientUserId })
		if (!recipient?.id || input.taskCount < 1) return null

		const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
		const projectPath = `/project/${input.projectId}`
		const title = `Taskee AI đã giao cho bạn ${input.taskCount} task mới`
		const content = `Tadaaaa, bạn đã được Taskee AI chọn mặt gửi vàng vào ${input.taskCount} task trong dự án mới ${input.projectName}!!!`

		const notification = await this.createNotification({
			userId: recipient.id,
			type: 'TASK_BULK_ASSIGNED_BY_AI',
			title,
			content,
			metadata: {
				projectId: input.projectId,
				projectName: input.projectName,
				taskCount: input.taskCount,
				projectPath,
				redirectUrl: `${frontendUrl}${projectPath}`
			}
		})

		if (recipient.email) {
			await sendBulkProjectAssignmentEmail({
				userId: recipient.id,
				toEmail: recipient.email,
				subject: title,
				notificationId: notification.id,
				templateData: {
					recipientName: recipient.name || 'there',
					projectName: input.projectName,
					taskCount: input.taskCount,
					projectUrl: `${frontendUrl}${projectPath}`
				}
			})
		}

		return notification
	}
}

export const notificationService = new NotificationService()
