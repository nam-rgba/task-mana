import { MailService } from '@sendgrid/mail'
import Handlebars from 'handlebars'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getEmailLogRepository } from '~/repository/email-log.repository.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const emailLogRepo = getEmailLogRepository()

export interface BulkProjectAssignmentEmailTemplateData {
	recipientName: string
	projectName: string
	taskCount: number
	projectUrl: string
}

interface SendBulkProjectAssignmentEmailInput {
	userId?: number
	toEmail: string
	subject: string
	templateData: BulkProjectAssignmentEmailTemplateData
	notificationId?: number
}

const renderBulkProjectAssignmentEmailHtml = (data: BulkProjectAssignmentEmailTemplateData) => {
	const templatePath = path.resolve(__dirname, '../../ui/bulk-project-assignment-email.handlebars')
	const templateSource = fs.readFileSync(templatePath, 'utf-8')
	const template = Handlebars.compile(templateSource)

	return template(data)
}

export const sendBulkProjectAssignmentEmail = async ({
	userId,
	toEmail,
	subject,
	templateData,
	notificationId
}: SendBulkProjectAssignmentEmailInput) => {
	const mailService = new MailService()
	mailService.setApiKey(process.env.SENDGRID_API_KEY || '')

	const html = renderBulkProjectAssignmentEmailHtml(templateData)

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
			templateName: 'bulk-project-assignment-email.handlebars',
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
			templateName: 'bulk-project-assignment-email.handlebars',
			status: 'FAILED',
			errorMessage: (error as Error)?.message || 'Unknown error',
			payload: {
				notificationId,
				templateData
			}
		})

		console.error('Error sending bulk project assignment email:', error)
	}
}