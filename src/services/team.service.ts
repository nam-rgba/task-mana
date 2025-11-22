import { CreateTeamDto } from '~/model/dto/team.dto.js'
import { TeamMemberRole } from '~/model/enums/team-role.enum.js'
import { getTeamMemberRepository } from '~/repository/team-member.repository.js'
import { getTeamRepository } from '~/repository/team.repository.js'
import { getUserRepository } from '~/repository/user.repository.js'
import { BadRequestError, ForbiddenError, NotFoundError } from '~/utils/error.reponse.js'

class TeamService {
	private teamRepository = getTeamRepository()
	private userRepository = getUserRepository()
	private teamMemberRepository = getTeamMemberRepository()

	// async createTeam
	// when create team, leadId is use id of who create team
	async createTeam(teamData: CreateTeamDto) {
		// validate input data
		const [checkLeadId, existingTeam] = await Promise.all([
			this.userRepository.findOne({ id: teamData.leadId }),
			this.teamRepository.findOneByKey(teamData.key)
		])

		if (teamData.leadId && !checkLeadId) {
			throw new NotFoundError(`Lead user with id ${teamData.leadId} not found!`)
		}

		// check team key unique
		if (existingTeam) {
			throw new Error(`Team with key ${teamData.key} already exists!`)
		}

		const newTeam = await this.teamRepository.create(teamData)
		if (!newTeam) {
			throw new ForbiddenError('Failed to create team.')
		}

		// when create team, auto add lead as team member with role LEAD
		if (teamData.leadId && checkLeadId && newTeam) {
			const teamMember = await this.teamMemberRepository.create({
				teamId: newTeam.id,
				userId: checkLeadId.id,
				role: TeamMemberRole.LEAD
			})

			if (!teamMember) {
				throw new ForbiddenError('Failed to add lead as team member.')
			}

			const resData = {
				...newTeam,
				lead: checkLeadId,
				members: [
					{
						...teamMember,
						user: checkLeadId
					}
				]
			}

			return resData
		}

		return { ...newTeam, lead: checkLeadId, members: [] }
	}

	async getTeamDetail(query: { id: number }, userId: number) {
		// check for param first
		if (!query.id) {
			throw new BadRequestError('Team id is required')
		}
		//bên auth service mình đã check user tồn tại rồi nên ko cần check lại ở đây
		if (!userId) {
			throw new BadRequestError('User id is required')
		}

		// kiểm tra user có phải thành viên của team ko
		const teamMember = await this.teamMemberRepository.findOneByUserAndTeamId(userId, query.id)
		if (!teamMember) {
			throw new ForbiddenError('User is not a member of this team, access denied.')
		}

		// tìm team theo id trước
		const team = await this.teamRepository.findDetailTeam({ id: query.id })
		if (!team) {
			throw new NotFoundError(`Team with id ${query.id} not found!`)
		}

		return team
	}
}

const teamService = new TeamService()
export { teamService, TeamService }
