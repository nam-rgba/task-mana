import { Router } from 'express'
import teamController from '~/controllers/team.controller.js'
import { validate } from '~/middleware/validate.js'
import { CreateTeamSchema } from '~/model/dto/team.dto.js'
import AsyncHandler from '~/utils/async-handler.js'

const router = Router()

router.post('/', validate(CreateTeamSchema), AsyncHandler(teamController.create))
export { router as teamRouter }
