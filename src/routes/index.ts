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
import { planRouter } from './plan.route.js'
import { billingRouter } from './billing.route.js'
import { scheduleRouter } from './schedule.route.js'
import { ganttRouter } from './gantt.route.js'
import { milestoneRouter } from './milestone.route.js'
import { documentRouter } from './document.route.js'
import { notificationRouter } from './notification.route.js'
import { apiKeyRouter } from './api-key.route.js'
import { skillRouter } from './skill.route.js'

const router = express.Router()

// Plan & Billing routes (plan is public, billing has mixed auth)
router.use('/plan', planRouter)
router.use('/billing', billingRouter)

// specific routes for data AI
router.use('/aidata', aiRouter)

// database management routes
router.use('/database', databaseRouter)

// AI feedback & evaluation routes
router.use('/ai-feedback', aiFeedbackRouter)

// middleware for logging chat interactions to Discord
import { chatLogger } from '~/middleware/chat.js'
// router.use(chatLogger)

// auth routes
router.use('/auth', authRouter)
router.use('/upload', uploadRouter)
router.use('/user', userRouter)
router.use('/users', userRouter)
router.use('/api-keys', apiKeyRouter)
router.use('/skills', skillRouter)
router.use('/task', taskRouter)
router.use('/team', teamRouter)
router.use('/project', projectRouter)

// Gantt / Schedule / Milestone routes (nested under project)
router.use('/project/:projectId/schedules', scheduleRouter)
router.use('/project/:projectId/gantt', ganttRouter)
router.use('/project/:projectId/milestones', milestoneRouter)
router.use('/document', documentRouter)
router.use('/notifications', notificationRouter)

export { router }
