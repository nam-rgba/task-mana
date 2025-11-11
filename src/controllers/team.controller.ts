import { Request, Response, NextFunction } from 'express'
import { teamService } from '~/services/team.service.js'
import { CreatedResponse } from '~/utils/success.response.js'

class TeamController {
	constructor() {}

	create = async (req: Request, res: Response, next: NextFunction) => {
		new CreatedResponse('Create team successfully!', 201, await teamService.createTeam(req.body)).send(res)
	}
}

const teamController = new TeamController()

export default teamController
