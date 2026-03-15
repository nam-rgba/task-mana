import 'reflect-metadata'
import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
const app = express()

import { router } from './routes/index.js'
import { initSyncAICronJob } from './services/cron/sync-ai.cron.js'

// Đặt trust proxy trước tất cả middleware để req.ip luôn trả về IP thật của client
app.set('trust proxy', 1)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

import morgan from 'morgan'
import { AppDataSource } from './db/data-source.js'
import { notificationWsService } from './services/notification/notification-ws.service.js'

// Đăng ký token tuỳ chỉnh để morgan lấy IP thật (qua proxy)
morgan.token('real-ip', (req) => {
	const forwarded = req.headers['x-forwarded-for']
	if (forwarded) {
		return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',')[0].trim()
	}
	return req.socket.remoteAddress ?? '-'
})
morgan.token('origin-source', (req) => req.headers['origin'] ?? req.headers['referer'] ?? '-')
morgan.token('colored-status', (_req, res) => {
	const status = res.statusCode
	const statusText = String(status)

	if (status >= 500) return `\x1b[31m${statusText}\x1b[0m`
	if (status >= 400) return `\x1b[33m${statusText}\x1b[0m`
	if (status >= 300) return `\x1b[36m${statusText}\x1b[0m`
	if (status >= 200) return `\x1b[32m${statusText}\x1b[0m`
	return statusText
})

// Format log: real-IP | method url status | origin | user-agent
app.use(
	morgan(
		'[:real-ip] - [:date[clf]] : :method  \n :url HTTP/:http-version" :colored-status :res[content-length] origin=:origin-source'
	)
)

app.use(cors())

import rateLimit from 'express-rate-limit'
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 phút
	max: 1000, // Mỗi IP chỉ được 1000 request / 15p
	standardHeaders: true,
	legacyHeaders: false
})
app.use(limiter)

// connect db
AppDataSource.initialize()
	.then(() => {
		console.log('✅ DB connected')
		const server = createServer(app)
		notificationWsService.init(server)

		// Initialize cron jobs
		initSyncAICronJob()

		server.listen(3000, () => console.log('🚀 Running on http://localhost:3000'))
	})
	.catch((err) => console.error('❌ DB init error:', err))

app.use('/api', router)

// Error handling function
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
app.use((error, req, res, next) => {
	const statusCode = error.statusCode || 500
	console.log('error', error)
	return res.status(statusCode).json({
		status: 'error',
		code: statusCode,
		message: `${statusCode}: ` + error.message || 'Internal Server Error'
	})
})
