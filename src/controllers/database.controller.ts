import { Request, Response } from 'express'
import { DatabaseService } from '~/services/database.service.js'
import { OKResponse, SuccessResponse } from '~/utils/success.response.js'

class DatabaseController {
	clearAllData = async (req: Request, res: Response) => {
		const result = await DatabaseService.clearAllData()
		new OKResponse('Clear all data successfully!', 200, result).send(res)
	}
}

export default new DatabaseController()
