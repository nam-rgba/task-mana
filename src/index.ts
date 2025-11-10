import 'reflect-metadata'
import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from 'cors'
const app = express()

import { router } from './routes/index.js'

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

console.log('first', process.env.DATABASE_URL)

import morgan from 'morgan'
import { AppDataSource } from './db/data-source.js'
import bodyParser from 'body-parser'

app.use(morgan('dev'))
app.use(cors())

// connect db
AppDataSource.initialize()
	.then(() => {
		console.log('✅ DB connected')
		app.listen(3000, () => console.log('🚀 Running on http://localhost:3000'))
	})
	.catch((err) => console.error('❌ DB init error:', err))

app.use(bodyParser.json())
app.use('/api', router)

app.use((req, res, next) => {
	const error = new Error('Not found')
	next(error)
})

// Error handling function
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
app.use((error, req, res, next) => {
	const statusCode = error.statusCode || 500
	console.log('error', error)
	return res.status(statusCode).json({
		status: 'error',
		code: statusCode,
		message: error.message || 'Internal Server Error'
	})
})
