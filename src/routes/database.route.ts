import express from 'express'
import databaseController from '~/controllers/database.controller.js'
import AsyncHandler from '../utils/async-handler.js'

const router = express.Router()

// POST /api/database/clear - Xóa tất cả dữ liệu
router.post('/clear', AsyncHandler(databaseController.clearAllData))

// GET /api/database/export - Export tất cả dữ liệu
router.get('/export', AsyncHandler(databaseController.exportAllData))

// POST /api/database/import - Import dữ liệu
router.post('/import', AsyncHandler(databaseController.importAllData))

export { router as databaseRouter }
