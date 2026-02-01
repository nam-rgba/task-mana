import express from 'express'
import databaseController from '~/controllers/database.controller.js'
import AsyncHandler from '../utils/async-handler.js'

const router = express.Router()

// POST /api/database/clear - Xóa tất cả dữ liệu
router.post('/clear', AsyncHandler(databaseController.clearAllData))

export { router as databaseRouter }
