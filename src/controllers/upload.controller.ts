import { Request, Response, NextFunction } from 'express'
import { CloudinaryService } from '~/services/upload/cloudinary.service.js'
import { BadRequestError } from '~/utils/error.reponse.js'
import { SuccessResponse } from '~/utils/success.response.js'
import path from 'path'

interface MulterRequest extends Request {
	file?: Express.Multer.File
}

class UploadController {
	uploadImage = async (req: MulterRequest, res: Response, next: NextFunction) => {
		const { file } = req

		// console.log('file.path:', file.path)
		// console.log('size:', file.size)

		if (!file) {
			throw new BadRequestError('No file uploaded')
		}

		const absolutePath = path.resolve(file.path)

		new SuccessResponse({
			message: 'Upload image successfully',
			statusCode: 200,
			metadata: await CloudinaryService.uploadImageFromLocal({
				filePath: absolutePath,
				folder: 'images'
			})
		}).send(res)
	}
}

const uploadController = new UploadController()

export { uploadController }
