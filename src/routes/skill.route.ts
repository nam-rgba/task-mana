import { Router } from 'express'
import { SkillController } from '~/controllers/skill.controller.js'
import AsyncHandler from '~/utils/async-handler.js'

const router = Router()
const ctrl = new SkillController()

router.get('/', AsyncHandler(ctrl.getAllSkills))

export { router as skillRouter }
