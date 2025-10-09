import { Request, Response, NextFunction } from 'express'
import { CloudinaryService } from '~/services/upload/cloudinary.service.js'
import { BadRequestError } from '~/utils/error.reponse.js'
import { SuccessResponse } from '~/utils/success.response.js'

interface MulterRequest extends Request {
	file?: Express.Multer.File
}

class UploadController {
	uploadImage = async (req: MulterRequest, res: Response, next: NextFunction) => {
		const { file } = req

		if (!file) {
			throw new BadRequestError('No file uploaded')
		}

		new SuccessResponse({
			message: 'Upload image successfully',
			statusCode: 200,
			metadata: await CloudinaryService.uploadImageFromLocal({
				filePath: file?.path as string,
				folder: 'images'
			})
		}).send(res)
	}
}

const uploadController = new UploadController()

export { uploadController }
