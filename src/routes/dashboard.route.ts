import { Router } from 'express'
import { dashboardController } from '~/controllers/dashboard.controller.js'
import AsyncHandler from '~/utils/async-handler.js'

const router = Router()

// Get dashboard stats
router.get('/stats', AsyncHandler(dashboardController.getDashboard))

export { router as dashboardRouter }
