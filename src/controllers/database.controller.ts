import { Request, Response } from 'express'
import { DatabaseService } from '~/services/database.service.js'
import { SuccessResponse } from '~/utils/success.response.js'

class DatabaseController {
	clearAllData = async (req: Request, res: Response) => {
		const result = await DatabaseService.clearAllData()
		new SuccessResponse({
			message: result.message,
			metadata: result
		}).send(res)
	}
}

export default new DatabaseController()
