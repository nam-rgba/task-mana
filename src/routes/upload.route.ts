import express from 'express'

import { uploadController } from '~/controllers/upload.controller.js'

import { upload } from '~/config/multer.config.js'
import AsyncHandler from '~/utils/async-handler.js'

const router = express.Router()

router.post('/image', upload.single('image'), AsyncHandler(uploadController.uploadImage))

export { router as uploadRouter }
