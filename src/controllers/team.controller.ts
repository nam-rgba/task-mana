import { Request, Response, NextFunction } from 'express'
import { teamService } from '~/services/team.service.js'
import { CreatedResponse, OKResponse } from '~/utils/success.response.js'

class TeamController {
	constructor() {}

	create = async (req: Request, res: Response, next: NextFunction) => {
		const userId = req.headers['x-user-id'] as unknown as number
		req.body.leadId = userId
		new CreatedResponse('Create team successfully!', 201, await teamService.createTeam(req.body)).send(res)
	}

	getOneDetail = async (req: Request, res: Response, next: NextFunction) => {
		const teamId = Number(req.params.id)
		const userId = req.headers['x-user-id'] as unknown as number
		const teamDetail = await teamService.getTeamDetail({ id: teamId }, userId)
		new CreatedResponse('Get team detail successfully!', 200, { team: teamDetail }).send(res)
	}

	addMember = async (req: Request, res: Response, next: NextFunction) => {
		const teamId = Number(req.params.id)
		const updatedTeam = await teamService.addMemberToTeam({ teamId, ...req.body })
		new CreatedResponse('Add member to team successfully!', 201, { team: updatedTeam }).send(res)
	}

	removeMember = async (req: Request, res: Response, next: NextFunction) => {
		const teamId = Number(req.params.id)
		const updatedTeam = await teamService.removeMemberFromTeam({ teamId, ...req.body })
		new CreatedResponse('Remove member from team successfully!', 200, { team: updatedTeam }).send(res)
	}

	findAllTeamOfUser = async (req: Request, res: Response, next: NextFunction) => {
		const userId = req.headers['x-user-id'] as unknown as number
		const teams = await teamService.findAllTeamOfUser(userId)
		new CreatedResponse('Get all teams of user successfully!', 200, { teams }).send(res)
	}

	updateDiscordServerId = async (req: Request, res: Response, next: NextFunction) => {
		const teamId = +req.params.id
		const { discordServerId } = req.body
		const team = await teamService.updateDiscordServerId({ teamId, discordId: discordServerId })
		new OKResponse('Update Discord Server ID successfully!', 209, team).send(res)
	}

	findAllTeam = async (req: Request, res: Response, next: NextFunction) => {
		const teams = await teamService.findAllTeam()
		new OKResponse('Get all teams successfully!', 200, { teams }).send(res)
	}
}

const teamController = new TeamController()

export default teamController
