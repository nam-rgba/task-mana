import { Repository } from 'typeorm'
import { CreateTeamDto } from '~/model/dto/team.dto.js'
import { Team } from '~/model/team.entity.js'
import { User } from '~/model/user.entity.js'
import { getTeamRepository } from '~/repository/team.repository.js'
import { getUserRepository } from '~/repository/user.repository.js'
import { NotFoundError } from '~/utils/error.reponse.js'

class TeamService {
	private teamRepository = getTeamRepository()
	private userRepository = getUserRepository()

	// async createTeam
	// when create team, leadId is use id of who create team
	async createTeam(teamData: CreateTeamDto) {
		// validate input data
		const checkLeadId = await this.userRepository.findOne({ id: teamData.leadId })
		if (teamData.leadId && !checkLeadId) {
			throw new NotFoundError(`Lead user with id ${teamData.leadId} not found!`)
		}

		// check team key unique
		const existingTeam = await this.teamRepository.findOneByKey(teamData.key)
		if (existingTeam) {
			throw new Error(`Team with key ${teamData.key} already exists!`)
		}
	}
}
