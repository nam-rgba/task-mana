import { z } from 'zod'
import { DocumentType } from '../enums/document.enum.js'

export const UploadDocumentSchema = z.object({
	type: z.nativeEnum(DocumentType, { error: 'type must be PROJECT, TASK_DESCRIPTION, TASK_RESULT, or COMMENT' }),
	projectId: z
		.union([z.number().int().positive(), z.string().transform((v) => parseInt(v, 10))])
		.refine((v) => !isNaN(v) && v > 0, 'projectId must be a positive number'),
	taskId: z
		.union([z.number().int().positive(), z.string().transform((v) => parseInt(v, 10))])
		.optional()
		.refine((v) => v === undefined || (!isNaN(v) && v > 0), 'taskId must be a positive number if provided')
})

export type UploadDocumentDto = z.infer<typeof UploadDocumentSchema>
