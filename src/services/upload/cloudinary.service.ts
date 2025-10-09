import { cloudinary } from '~/config/cloudinary.config.js'

const uploadImageFromLocal = async ({ filePath, folder }: { filePath: string; folder?: string }) => {
	try {
		const result = await cloudinary.uploader.upload(filePath, {
			folder: folder || 'default'
		})
		return {
			url: result.secure_url,
			public_id: result.public_id
		}
	} catch (error) {
		throw new Error(`Cloudinary upload failed: ${error}`)
	}
}

export const CloudinaryService = {
	uploadImageFromLocal
}
