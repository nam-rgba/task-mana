import { Request, Response } from 'express'
import { DatabaseService } from '~/services/database.service.js'
import { OKResponse, SuccessResponse } from '~/utils/success.response.js'

class DatabaseController {
	clearAllData = async (req: Request, res: Response) => {
		const result = await DatabaseService.clearAllData()
		new OKResponse('Clear all data successfully!', 200, result).send(res)
	}

	exportAllData = async (req: Request, res: Response) => {
		const result = await DatabaseService.exportAllData()
		new OKResponse('Export all data successfully!', 200, result).send(res)
	}

	importAllData = async (req: Request, res: Response) => {
		// Xử lý cả 2 trường hợp:
		// 1. { data: { users: [], teams: [], ... } } - từ script
		// 2. { users: [], teams: [], ... } - gửi trực tiếp
		const finalData = req.body.data || req.body

		// Log để debug
		console.log('Import request body keys:', Object.keys(req.body))
		console.log('finalData keys:', finalData ? Object.keys(finalData) : 'null')

		// Kiểm tra có ít nhất 1 bảng data hợp lệ
		const validTables = [
			'users',
			'plans',
			'teams',
			'teamMembers',
			'projects',
			'tasks',
			'aiFeedbacks',
			'orders',
			'subscriptions',
			'paymentHistories',
			'tokens'
		]
		const hasValidData = validTables.some(
			(table) => finalData && Array.isArray(finalData[table]) && finalData[table].length > 0
		)

		if (!hasValidData) {
			throw new Error('Invalid data format. Expected at least one of: ' + validTables.join(', '))
		}

		const result = await DatabaseService.importAllData(finalData)
		new OKResponse('Import all data successfully!', 200, result).send(res)
	}
}

export default new DatabaseController()
