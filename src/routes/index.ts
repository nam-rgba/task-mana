import express from 'express'
import { router as authRouter } from './auth.route.js'
import { uploadRouter } from './upload.route.js'
import { userRouter } from './user.route.js'
import { taskRouter } from './task.route.js'
import { teamRouter } from './team.route.js'
import { projectRouter } from './project.route.js'
import { aiRouter } from './aidata.route.js'
import { databaseRouter } from './database.route.js'
import { aiFeedbackRouter } from './ai-feedback.route.js'

const router = express.Router()

// specific routes for data AI
router.use('/aidata', aiRouter)

// database management routes
router.use('/database', databaseRouter)

// AI feedback & evaluation routes
router.use('/ai-feedback', aiFeedbackRouter)

// middleware for logging chat interactions to Discord
import { chatLogger } from '~/middleware/chat.js'
router.use(chatLogger)

// auth routes
router.use('/auth', authRouter)
router.use('/upload', uploadRouter)
router.use('/user', userRouter)
router.use('/task', taskRouter)
router.use('/team', teamRouter)
router.use('/project', projectRouter)

export { router }
