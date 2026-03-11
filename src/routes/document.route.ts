import { Router } from 'express'
import { documentController } from '~/controllers/document.controller.js'
import { upload } from '~/config/multer.config.js'
import AsyncHandler from '~/utils/async-handler.js'
import { validate } from '~/middleware/validate.js'
import { UploadDocumentSchema } from '~/model/dto/document.dto.js'

const router = Router({ mergeParams: true })

// Upload document (multipart/form-data: file + type + projectId + taskId?)
router.post('/', upload.single('file'), validate(UploadDocumentSchema), AsyncHandler(documentController.upload))

// Get project-level documents
router.get('/project/:projectId', AsyncHandler(documentController.getProjectDocuments))

// Get task documents (optional ?type=TASK_DESCRIPTION|TASK_RESULT)
router.get('/task/:taskId', AsyncHandler(documentController.getTaskDocuments))

// Delete document
router.delete('/:id', AsyncHandler(documentController.deleteDocument))

export { router as documentRouter }
