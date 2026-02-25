import { Router } from 'express'
import teamController from '~/controllers/team.controller.js'
import { validate } from '~/middleware/validate.js'
import { CreateTeamSchema } from '~/model/dto/team.dto.js'
import AsyncHandler from '~/utils/async-handler.js'

const router = Router()

router.post('/', validate(CreateTeamSchema), AsyncHandler(teamController.create))
router.get('/all', AsyncHandler(teamController.findAllTeam))
router.get('/:id', AsyncHandler(teamController.getOneDetail))
router.patch('/:id/member', AsyncHandler(teamController.addMember))
router.patch('/:id/member/remove', AsyncHandler(teamController.removeMember))
router.get('/', AsyncHandler(teamController.findAllTeamOfUser))
router.patch('/:id/discord-id', AsyncHandler(teamController.updateDiscordServerId))
export { router as teamRouter }
