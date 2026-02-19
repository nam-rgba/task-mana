import discordService from '~/services/chat/discord.service.js'

export function chatLogger(req: any, res: any, next: any) {
	const start = Date.now()
	res.on('finish', () => {
		const logData = {
			method: req.method,
			host: req.hostname,
			start,
			code: res.statusCode,
			content: {
				headers: req.headers,
				body: req.body,
				query: req.query
			}
		}
		discordService.sendFormatCode(logData)
	})
	next()
}
