import { Client, GatewayIntentBits, TextChannel } from 'discord.js'
import { projectService } from '../project.service.js'
import { aiGenService } from '../ai/ai-gen.service.js'
import { taskService } from '../task.service.js'
import dayjs from 'dayjs'

const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const PREFIX = '!'
const PREFIX_PROJECT = 'P@'

class DiscordService {
	private client: Client
	private channelId: string

	constructor() {
		this.client = new Client({
			intents: [
				GatewayIntentBits.DirectMessages,
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent
			]
		})

		this.channelId = CHANNEL_ID || ''

		this.client.on('clientReady', () => {
			console.log(`Logged in as ${this.client.user?.tag}!`)
			this.listenForMessages()
		})

		this.client.login(BOT_TOKEN)
	}

	sendFormatCode(logData: any) {
		const { method, start, code, host, content } = logData
		const formatted = {
			content: `📝 ${method} request from: ${host}\n🕒 ${new Date(start).toLocaleString()}\n`,
			embeds: [
				{
					color: parseInt(code.toString()[0] == '2' ? '00ff00' : 'ff0000', 16), // Xanh lá (200~299), bạn có thể thay theo status code
					title: `${method} -- ${code}`,
					description: '```json\n' + JSON.stringify(content, null, 2) + '\n```'
				}
			]
		}

		// this.sendMessage(formatted)
	}

	async sendMessage(message: any) {
		if (!this.channelId) {
			console.error('Discord channel ID is not set.')
			return
		}

		try {
			const channel = await this.client.channels.fetch(this.channelId)
			if (channel && channel.isTextBased()) {
				await (channel as TextChannel).send(message)
			}
		} catch (error) {
			console.error('Failed to send message to Discord:', error)
		}
	}

	// lắng nghe các tin nhắn đến từ Discord
	async listenForMessages() {
		this.client.on('messageCreate', async (message) => {
			if (message.author.bot) return // bỏ qua tin nhắn từ bot

			if (message.content.startsWith(PREFIX)) {
				const commandBody = message.content.slice(PREFIX.length).trim()
				const args = commandBody.split(' ')
				const command = args.shift()?.toLowerCase()

				// xử lý các lệnh ở đây
				if (command === 'ping') {
					message.reply('Pong!')
				} else if (command === 'projects') {
					const projects = await projectService.getProjectAndId()
					const projectList = projects.map((p) => `- ${p.name} (ID: ${p.id})`).join('\n')
					message.reply(`Current projects:\n${projectList}`)
				} else if (command === 'create-task') {
					const projectId = args.find((arg) => arg.startsWith(PREFIX_PROJECT))?.slice(PREFIX_PROJECT.length)
					const taskName = args.filter((arg) => !arg.startsWith(PREFIX_PROJECT)).join(' ')

					if (!projectId) {
						message.reply('Please specify the project ID using P@<project_id>. Example: !create-task P@123 Task name')
						return
					}

					if (!taskName) {
						message.reply('Please specify the task name. Example: !create-task P@123 Task name')
						return
					}

					try {
						const { composed_task } = await aiGenService.generateCompleteTask({
							project_id: parseInt(projectId),
							user_input: taskName
						})
						console.log('Generated task from AI:', composed_task)
						// tạo task mới trong dự án
						await taskService.createTask({
							title: composed_task.title,
							description: composed_task.description,
							projectId: parseInt(projectId),
							priority: composed_task.priority,
							type: composed_task.type,
							dueDate: dayjs(composed_task.due_date).unix()
						})
						message.reply(`Task "${composed_task.title}" created successfully in project ID ${projectId}!`)
					} catch (error) {
						console.error('Error creating task:', error)
						message.reply('Failed to create task. Please check the connection and try again.')
					}
				} else if (command === 'help') {
					message.reply(
						'Available commands:\n!ping - Check if the bot is responsive\n!projects - Show all projects with id\n!create-task [task name] P@<project_id> - Create a new task in a specific project P\n!help - Show this help message'
					)
				}
			}
		})
	}
}

export default new DiscordService()
