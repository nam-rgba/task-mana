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
		// 1. { data: {...} } - gửi trực tiếp
		// 2. { success, message, data: {...}, stats } - từ export response
		const importData = req.body.data || req.body

		// Nếu body có cấu trúc từ export, lấy data bên trong
		const finalData = importData.users ? importData : importData.data

		const result = await DatabaseService.importAllData(finalData)
		new OKResponse('Import all data successfully!', 200, result).send(res)
	}
}

export default new DatabaseController()
