import { cloudinary } from '~/config/cloudinary.config.js'
import { BadRequestError } from '~/utils/error.reponse.js'

import fs from 'fs'

const uploadImageFromLocal = async ({ filePath, folder }: { filePath: string; folder?: string }) => {
	console.log(filePath)
	try {
		const fileStream = fs.createReadStream(filePath)

		const uploadResult: any = await new Promise((resolve, reject) => {
			const uploadStream = cloudinary.uploader.upload_stream(
				{
					folder: folder || 'default'
				},
				(error, result) => {
					if (error) return reject(error)
					resolve(result)
				}
			)

			fileStream.pipe(uploadStream)
		})

		return {
			url: uploadResult.secure_url,
			public_id: uploadResult.public_id
		}
	} catch (error) {
		console.error('Error uploading image to Cloudinary:', error)
		throw new Error('Failed to upload image to Cloudinary')
	}
}

export const CloudinaryService = {
	uploadImageFromLocal
}
