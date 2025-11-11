import express from 'express'
import { router as authRouter } from './auth.route.js'
import { uploadRouter } from './upload.route.js'
import { userRouter } from './user.route.js'
import { taskRouter } from './task.route.js'
import { teamRouter } from './team.route.js'

const router = express.Router()

// auth routes
router.use('/auth', authRouter)
router.use('/upload', uploadRouter)
router.use('/user', userRouter)
router.use('/task', taskRouter)
router.use('/team', teamRouter)

export { router }
