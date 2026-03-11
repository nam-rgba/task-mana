import { MailService } from '@sendgrid/mail'
import Handlebars from 'handlebars'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getEmailLogRepository } from '~/repository/email-log.repository.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const emailLogRepo = getEmailLogRepository()

export interface TaskEmailTemplateData {
	recipientName: string
	actorName: string
	taskTitle: string
	actionText: string
	roleText: string
	taskId?: number
	frontendUrl?: string
}

interface SendTaskEmailInput {
	userId?: number
	toEmail: string
	subject: string
	templateData: TaskEmailTemplateData
	notificationId?: number
}

const renderTaskEmailHtml = (data: TaskEmailTemplateData) => {
	const templatePath = path.resolve(__dirname, '../../ui/task-notification-email.handlebars')
	const templateSource = fs.readFileSync(templatePath, 'utf-8')
	const template = Handlebars.compile(templateSource)

	const taskUrl = data.taskId
		? `${data.frontendUrl || process.env.FRONTEND_URL || ''}/tasks/${data.taskId}`
		: data.frontendUrl || process.env.FRONTEND_URL || ''

	return template({
		...data,
		taskUrl
	})
}

export const sendTaskNotificationEmail = async ({
	userId,
	toEmail,
	subject,
	templateData,
	notificationId
}: SendTaskEmailInput) => {
	const mailService = new MailService()
	mailService.setApiKey(process.env.SENDGRID_API_KEY || '')

	const html = renderTaskEmailHtml(templateData)

	const msg = {
		to: toEmail,
		from: {
			email: process.env.SENDGRID_FROM_EMAIL || 'noreply@taskee.codes',
			name: 'Taskee Team'
		},
		subject,
		html
	}

	try {
		await mailService.send(msg)
		await emailLogRepo.create({
			userId,
			toEmail,
			subject,
			templateName: 'task-notification-email.handlebars',
			status: 'SENT',
			payload: {
				notificationId,
				templateData
			}
		})
	} catch (error) {
		await emailLogRepo.create({
			userId,
			toEmail,
			subject,
			templateName: 'task-notification-email.handlebars',
			status: 'FAILED',
			errorMessage: (error as Error)?.message || 'Unknown error',
			payload: {
				notificationId,
				templateData
			}
		})

		console.error('Error sending task notification email:', error)
	}
}
