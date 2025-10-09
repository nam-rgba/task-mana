import express from 'express'
import { router as authRouter } from './auth.route.js'
import { uploadRouter } from './upload.route.js'

const router = express.Router()

// auth routes
router.use('/auth', authRouter)
router.use('/upload', uploadRouter)

export { router }
