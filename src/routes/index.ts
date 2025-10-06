import express from 'express'
import { router as authRouter } from './auth.route.js'

const router = express.Router()

// auth routes
router.use('/auth', authRouter)

export { router }
