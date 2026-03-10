import { z } from 'zod'
import { DocumentType } from '../enums/document.enum.js'

export const UploadDocumentSchema = z.object({
	type: z.nativeEnum(DocumentType, { error: 'type must be PROJECT, TASK_DESCRIPTION, or TASK_RESULT' }),
	projectId: z.number({ error: 'projectId is required' }).int().positive(),
	taskId: z.number().int().positive().optional()
})

export type UploadDocumentDto = z.infer<typeof UploadDocumentSchema>
