import { Client, GatewayIntentBits, TextChannel, REST, Routes, SlashCommandBuilder } from 'discord.js'
import { projectService } from '../project.service.js'
import { aiGenService } from '../ai/ai-gen.service.js'
import { taskService } from '../task.service.js'
import { teamService } from '../team.service.js'
import dayjs from 'dayjs'

const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const CLIENT_ID = process.env.DISCORD_CLIENT_ID

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
			this.registerSlashCommands()
			this.listenForInteractions()
			this.listenForGuildEvents()
		})

		this.client.login(BOT_TOKEN)
	}

	// Đăng ký slash commands với Discord
	async registerSlashCommands() {
		const commands = [
			// Lệnh ping - Kiểm tra bot có hoạt động không
			new SlashCommandBuilder().setName('ping').setDescription(' Kiểm tra xem bot có đang hoạt động không'),

			// Lệnh projects - Xem danh sách tất cả dự án
			new SlashCommandBuilder()
				.setName('projects')
				.setDescription('Hiển thị danh sách tất cả các dự án với ID của chúng'),

			// Lệnh create-task - Tạo task mới với AI
			new SlashCommandBuilder()
				.setName('create-task')
				.setDescription('Tạo task mới trong dự án (AI sẽ tự động hoàn thiện thông tin)')
				.addIntegerOption((option) =>
					option.setName('project_id').setDescription('ID của dự án cần tạo task').setRequired(true)
				)
				.addStringOption((option) =>
					option.setName('task_name').setDescription('Tên task hoặc mô tả ngắn (AI sẽ tạo chi tiết)').setRequired(true)
				),

			// Lệnh help - Hướng dẫn sử dụng
			new SlashCommandBuilder().setName('help').setDescription('Xem hướng dẫn sử dụng các lệnh của bot'),

			// Lệnh server-info - Xem thông tin server hiện tại
			new SlashCommandBuilder()
				.setName('server-info')
				.setDescription('Hiển thị thông tin chi tiết về server Discord hiện tại')
		].map((command) => command.toJSON())

		const rest = new REST({ version: '10' }).setToken(BOT_TOKEN!)

		try {
			console.log('Started refreshing slash commands...')

			await rest.put(Routes.applicationCommands(CLIENT_ID!), {
				body: commands
			})

			console.log(' Successfully registered slash commands!')
		} catch (error) {
			console.error('Error registering slash commands:', error)
		}
	}

	sendFormatCode(logData: any) {
		const { method, start, code, host, content } = logData
		const formatted = {
			content: ` ${method} request from: ${host}\n ${new Date(start).toLocaleString()}\n`,
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

	// Lắng nghe và xử lý slash commands
	async listenForInteractions() {
		this.client.on('interactionCreate', async (interaction) => {
			if (!interaction.isChatInputCommand()) return

			const { commandName } = interaction

			try {
				// ---------------------------------------------------
				// Lệnh: /ping
				// Mục đích: Kiểm tra bot có hoạt động không
				// ---------------------------------------------------
				if (commandName === 'ping') {
					await interaction.reply({
						content: ' Pong! Bot đang hoạt động bình thường.',
						ephemeral: false
					})
				}

				// ---------------------------------------------------
				// Lệnh: /projects
				// Mục đích: Hiển thị danh sách tất cả dự án với ID
				// ---------------------------------------------------
				else if (commandName === 'projects') {
					await interaction.deferReply() // Trì hoãn reply vì có thể mất thời gian

					const projects = await projectService.getProjectAndId()

					if (projects.length === 0) {
						await interaction.editReply('Chưa có dự án nào trong hệ thống.')
						return
					}

					const projectList = projects.map((p, index) => `${index + 1}. **${p.name}** (ID: \`${p.id}\`)`).join('\n')

					await interaction.editReply({
						content: ` **Danh sách dự án hiện tại:**\n\n${projectList}`
					})
				}

				// ---------------------------------------------------
				// Lệnh: /create-task
				// Mục đích: Tạo task mới với sự hỗ trợ của AI
				// Tham số:
				//   - project_id: ID của dự án (bắt buộc)
				//   - task_name: Tên/mô tả task (bắt buộc)
				// AI sẽ tự động:
				//   - Hoàn thiện title
				//   - Tạo description chi tiết
				//   - Gợi ý priority (LOW/MEDIUM/HIGH)
				//   - Gợi ý type (FEATURE/BUG/IMPROVEMENT)
				//   - Đề xuất due_date
				// ---------------------------------------------------
				else if (commandName === 'create-task') {
					await interaction.deferReply() // Trì hoãn reply vì AI cần thời gian xử lý

					const projectId = interaction.options.getInteger('project_id', true)
					const taskName = interaction.options.getString('task_name', true)

					try {
						// Gọi AI để tạo task hoàn chỉnh
						const { composed_task } = await aiGenService.generateCompleteTask({
							project_id: projectId,
							user_input: taskName
						})

						console.log('Generated task from AI:', composed_task)

						// Tạo task trong database
						await taskService.createTask({
							title: composed_task.title,
							description: composed_task.description,
							projectId: projectId,
							priority: composed_task.priority,
							type: composed_task.type,
							dueDate: dayjs(composed_task.due_date).unix()
						})

						// Trả về thông báo thành công với chi tiết
						await interaction.editReply({
							content:
								` **Task đã được tạo thành công!**\n\n` +
								` **Title:** ${composed_task.title}\n` +
								` **Description:** ${composed_task.description}\n` +
								` **Priority:** ${composed_task.priority}\n` +
								` **Type:** ${composed_task.type}\n` +
								` **Due Date:** ${dayjs(composed_task.due_date).format('DD/MM/YYYY')}\n` +
								` **Project ID:** ${projectId}`
						})
					} catch (error) {
						console.error('Error creating task:', error)
						await interaction.editReply({
							content:
								'**Lỗi:** Không thể tạo task. Vui lòng kiểm tra:\n' +
								`• Project ID \`${projectId}\` có tồn tại không?\n` +
								'• Kết nối AI service có hoạt động không?\n' +
								'• Database có sẵn sàng không?'
						})
					}
				}

				// ---------------------------------------------------
				// Lệnh: /server-info
				// Mục đích: Hiển thị thông tin về server Discord
				// Thông tin có thể lấy:
				//   - interaction.guild: đối tượng guild (server)
				//   - interaction.guild.name: tên server
				//   - interaction.guild.memberCount: số lượng member
				//   - interaction.guild.ownerId: ID của server owner
				//   - interaction.guild.createdAt: ngày tạo server
				//   - interaction.user: người dùng gọi lệnh
				//   - interaction.channel: kênh hiện tại
				// ---------------------------------------------------
				else if (commandName === 'server-info') {
					const guild = interaction.guild

					if (!guild) {
						await interaction.reply({
							content: ' Lệnh này chỉ có thể sử dụng trong server, không dùng được trong DM.',
							ephemeral: true
						})
						return
					}

					// Lấy thông tin owner
					const owner = await guild.members.fetch(guild.ownerId)

					// Lấy thông tin người dùng hiện tại
					const user = interaction.user

					// Format ngày tạo server
					const createdDate = dayjs(guild.createdAt).format('DD/MM/YYYY HH:mm')

					await interaction.reply({
						content:
							` **Thông tin Server**\n\n` +
							` **Tên Server:** ${guild.name}\n` +
							` **Server ID:** \`${guild.id}\`\n` +
							` **Owner:** ${owner.user.tag} (\`${owner.id}\`)\n` +
							` **Số thành viên:** ${guild.memberCount}\n` +
							` **Ngày tạo:** ${createdDate}\n` +
							`**Kênh hiện tại:** <#${interaction.channelId}>\n\n` +
							`**Người dùng lệnh:** ${user.tag} (\`${user.id}\`)`,
						ephemeral: false
					})
				}

				// ---------------------------------------------------
				// Lệnh: /help
				// Mục đích: Hiển thị hướng dẫn sử dụng tất cả lệnh
				// ---------------------------------------------------
				else if (commandName === 'help') {
					await interaction.reply({
						content:
							' **Hướng dẫn sử dụng bot quản lý dự án**\n\n' +
							'**Các lệnh có sẵn:**\n\n' +
							' `/ping`\n' +
							'   → Kiểm tra xem bot có đang hoạt động không\n\n' +
							' `/projects`\n' +
							'   → Xem danh sách tất cả các dự án và ID của chúng\n\n' +
							' `/create-task`\n' +
							'   → Tạo task mới với sự hỗ trợ của AI\n' +
							'   → **Tham số:**\n' +
							'      • `project_id`: ID của dự án (số nguyên)\n' +
							'      • `task_name`: Tên hoặc mô tả ngắn về task\n' +
							'   → **AI sẽ tự động:**\n' +
							'      • Hoàn thiện title chuyên nghiệp\n' +
							'      • Tạo description chi tiết\n' +
							'      • Gợi ý priority (LOW/MEDIUM/HIGH)\n' +
							'      • Gợi ý type (FEATURE/BUG/IMPROVEMENT)\n' +
							'      • Đề xuất deadline hợp lý\n\n' +
							' `/server-info`\n' +
							'   → Xem thông tin chi tiết về server Discord này\n\n' +
							'`/help`\n' +
							'   → Hiển thị hướng dẫn này\n\n' +
							'**Tip:** Bạn có thể gõ `/` và chọn lệnh từ menu gợi ý!',
						ephemeral: true // Chỉ người dùng gõ lệnh mới thấy
					})
				}
			} catch (error) {
				console.error('Error handling interaction:', error)
				if (interaction.deferred) {
					await interaction.editReply('Có lỗi xảy ra khi xử lý lệnh.')
				} else {
					await interaction.reply({
						content: 'Có lỗi xảy ra khi xử lý lệnh.',
						ephemeral: true
					})
				}
			}
		})
	}

	// Lắng nghe sự kiện guild (server)
	async listenForGuildEvents() {
		// ---------------------------------------------------
		// Sự kiện: guildCreate
		// Mục đích: Khi bot được thêm vào một guild/server mới
		// Kiểm tra xem guild ID có khớp với discordServerId
		// trong team nào không, nếu có thì cập nhật isDiscordServerLinked = true
		// ---------------------------------------------------
		this.client.on('guildCreate', async (guild) => {
			console.log(` Bot đã được thêm vào guild: ${guild.name} (ID: ${guild.id})`)

			try {
				// Tìm team có discordServerId trùng với guild.id
				const linkedTeam = await teamService.linkDiscordServer(guild.id)

				if (linkedTeam) {
					console.log(`Đã liên kết guild "${guild.name}" với team "${linkedTeam.name}" (ID: ${linkedTeam.id})`)

					// Gửi thông báo vào server vừa được liên kết
					const systemChannel = guild.systemChannel
					if (systemChannel && systemChannel.isTextBased()) {
						await systemChannel.send({
							content:
								`**Chào mừng!**\n\n` +
								`Bot quản lý dự án đã được liên kết thành công với team **${linkedTeam.name}**!\n\n` +
								`Bạn có thể sử dụng lệnh \`/help\` để xem danh sách các lệnh có sẵn.`
						})
					}
				} else {
					console.log(`ℹGuild "${guild.name}" (ID: ${guild.id}) chưa được đăng ký với team nào trong hệ thống.`)

					// Gửi hướng dẫn nếu guild chưa được liên kết
					const systemChannel = guild.systemChannel
					if (systemChannel && systemChannel.isTextBased()) {
						await systemChannel.send({
							content:
								` **Xin chào!**\n\n` +
								`Cảm ơn bạn đã thêm bot vào server!\n` +
								`Tuy nhiên, server này chưa được liên kết với team nào trong hệ thống.\n\n` +
								`**Server ID của bạn:** \`${guild.id}\`\n\n` +
								`Vui lòng sử dụng Server ID này để đăng ký team trên hệ thống quản lý.`
						})
					}
				}
			} catch (error) {
				console.error(' Lỗi khi xử lý sự kiện guildCreate:', error)
			}
		})

		// ---------------------------------------------------
		// Sự kiện: guildDelete
		// Mục đích: Khi bot bị xóa khỏi guild/server
		// Có thể cập nhật isDiscordServerLinked = false nếu cần
		// ---------------------------------------------------
		this.client.on('guildDelete', async (guild) => {
			console.log(`👋 Bot đã bị xóa khỏi guild: ${guild.name} (ID: ${guild.id})`)
			// Có thể thêm logic cập nhật isDiscordServerLinked = false ở đây nếu cần
		})
	}
}

export default new DiscordService()
