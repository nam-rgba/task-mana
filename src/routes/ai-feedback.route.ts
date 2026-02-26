import { Router } from 'express'
import ctrl from '~/controllers/ai-feedback.controller.js'
import AsyncHandler from '~/utils/async-handler.js'

const router = Router()

// ─── Dashboard / Query ────────────────────────────────────────────────────────
router.get('/', AsyncHandler(ctrl.getList))
router.get('/project/:projectId/summary', AsyncHandler(ctrl.getProjectSummary))
router.get('/:id', AsyncHandler(ctrl.getById))

// NOTE: POST / (track suggestion) is intentionally NOT exposed.
// Tracking is done internally by AI service methods only.

// ─── Submit feedback ─────────────────────────────────────────────────────────
router.patch('/:id/explicit', AsyncHandler(ctrl.submitExplicit))
// Use PATCH /implicit only for task UPDATE (taskId already exists).
// For task CREATE: embed aiFeedback in the task creation payload instead.
router.patch('/implicit', AsyncHandler(ctrl.submitImplicit))

export { router as aiFeedbackRouter }
