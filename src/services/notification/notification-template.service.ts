import Handlebars from 'handlebars'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface TaskNotificationTemplateData {
	actorName: string
	actionText: string
	taskTitle: string
	roleText: string
}

export const renderTaskNotificationContent = (data: TaskNotificationTemplateData) => {
	const templatePath = path.resolve(__dirname, '../../ui/task-notification.handlebars')
	const templateSource = fs.readFileSync(templatePath, 'utf-8')
	const template = Handlebars.compile(templateSource)

	return template(data)
}
