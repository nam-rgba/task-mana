import { MailService } from '@sendgrid/mail'
import Handlebars from 'handlebars'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const sendWelcomeEmail = async (email: string, name: string) => {
	const mailService = new MailService()
	mailService.setApiKey(process.env.SENDGRID_API_KEY || '')

	const templatePath = path.resolve(__dirname, '../../ui/welcome.handlebars')
	const templateSource = fs.readFileSync(templatePath, 'utf-8')
	const template = Handlebars.compile(templateSource)
	const html = template({ name, email })

	const msg = {
		to: email,
		from: {
			email: process.env.SENDGRID_FROM_EMAIL || 'noreply@taskee.codes',
			name: 'Taskee Team'
		},
		subject: 'Welcome to Taskee!',
		html
	}

	try {
		await mailService.send(msg)
	} catch (error) {
		console.error('Error sending welcome email:', error)
	}
}

export const sendVerificationEmail = async (email: string, name: string, token: string) => {
	const mailService = new MailService()
	mailService.setApiKey(process.env.SENDGRID_API_KEY || '')

	const templatePath = path.resolve(__dirname, '../../ui/verifyEmail.handlebars')
	const templateSource = fs.readFileSync(templatePath, 'utf-8')
	const template = Handlebars.compile(templateSource)
	const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`
	const html = template({ name, email, verifyUrl })

	const msg = {
		to: email,
		from: {
			email: process.env.SENDGRID_FROM_EMAIL || '',
			name: 'Taskee Team'
		},
		subject: 'Verify Your Email for Taskee',
		html
	}

	try {
		await mailService.send(msg)
	} catch (error) {
		console.error('Error sending verification email:', error)
	}
}
