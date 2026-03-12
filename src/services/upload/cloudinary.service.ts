import { cloudinary } from '~/config/cloudinary.config.js'
import { BadRequestError } from '~/utils/error.reponse.js'

import fs from 'fs'
import path from 'path'

const sanitizeFileBaseName = (fileName: string) => {
	const parsedName = path.parse(fileName).name
	const sanitizedName = parsedName
		.replace(/[^a-zA-Z0-9-_]/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')

	return sanitizedName || `file-${Date.now()}`
}

const buildPublicId = ({ fileName, resourceType }: { fileName: string; resourceType: 'image' | 'raw' | 'auto' }) => {
	const extension = path.extname(fileName).replace('.', '').toLowerCase()
	const baseName = `${Date.now()}-${sanitizeFileBaseName(fileName)}`

	if (resourceType === 'raw' && extension) {
		return `${baseName}.${extension}`
	}

	return baseName
}

const uploadImageFromLocal = async ({
	filePath,
	folder,
	resourceType = 'image',
	fileName
}: {
	filePath: string
	folder?: string
	resourceType?: 'image' | 'raw' | 'auto'
	fileName?: string
}) => {
	console.log(filePath)
	try {
		const fileStream = fs.createReadStream(filePath)
		const resolvedFileName = fileName || path.basename(filePath)
		const publicId = buildPublicId({ fileName: resolvedFileName, resourceType })

		const uploadResult: any = await new Promise((resolve, reject) => {
			const uploadStream = cloudinary.uploader.upload_stream(
				{
					folder: folder || 'default',
					resource_type: resourceType,
					type: 'upload',
					access_mode: 'public',
					public_id: publicId,
					filename_override: resolvedFileName,
					use_filename: false,
					unique_filename: false
				},
				(error, result) => {
					if (error) return reject(error)
					resolve(result)
				}
			)

			fileStream.pipe(uploadStream)
		})

		const uploadedResourceType: 'image' | 'video' | 'raw' = uploadResult.resource_type

		// Raw files trên free/untrusted Cloudinary accounts bị block delivery khi dùng URL thường.
		// Dùng signed URL để bypass restriction "show_original_customer_untrusted".
		let deliveryUrl = uploadResult.secure_url
		if (uploadedResourceType === 'raw') {
			deliveryUrl = cloudinary.url(uploadResult.public_id, {
				resource_type: 'raw',
				type: 'upload',
				sign_url: true,
				secure: true
			})
		}

		return {
			url: deliveryUrl,
			public_id: uploadResult.public_id,
			resource_type: uploadedResourceType,
			format: uploadResult.format
		}
	} catch (error) {
		console.error('Error uploading image to Cloudinary:', error)
		throw new Error('Failed to upload image to Cloudinary')
	}
}

export const CloudinaryService = {
	uploadImageFromLocal
}
