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
		if (checkLeadId && newTeam) {
			console.log('Adding lead as team member with role LEADL=:', checkLeadId.id)
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

	async addMemberToTeam({ teamId, userId, role }: { teamId: number; userId: number; role?: TeamMemberRole }) {
		// check team exists
		const team = await this.teamRepository.findOneById(teamId)
		if (!team) {
			throw new NotFoundError(`Team with id ${teamId} not found!`)
		}
		// check user exists
		const user = await this.userRepository.findOne({ id: userId })
		if (!user) {
			throw new NotFoundError(`User with id ${userId} not found!`)
		}
		// check user is already a member of the team
		const existingMember = await this.teamMemberRepository.findOneByUserAndTeamId(userId, teamId)
		if (existingMember) {
			throw new BadRequestError(`User with id ${userId} is already a member of team ${teamId}.`)
		}

		// create new team member
		const newMember = await this.teamMemberRepository.create({
			teamId,
			userId,
			role: role || TeamMemberRole.MEMBER
		})
		return newMember
	}

	async removeMemberFromTeam({ teamId, userId }: { teamId: number; userId: number }) {
		// check team exists
		const team = await this.teamRepository.findOneById(teamId)
		if (!team) {
			throw new NotFoundError(`Team with id ${teamId} not found!`)
		}
		// check user exists
		const user = await this.userRepository.findOne({ id: userId })
		if (!user) {
			throw new NotFoundError(`User with id ${userId} not found!`)
		}
		// check user is a member of the team
		const existingMember = await this.teamMemberRepository.findOneByUserAndTeamId(userId, teamId)
		if (!existingMember) {
			throw new BadRequestError(`User with id ${userId} is not a member of team ${teamId}.`)
		}

		// remove team member
		const removedMember = await this.teamMemberRepository.deleteOne(existingMember.id)
		return removedMember
	}

	async findAllTeamOfUser(userId: number) {
		const teams = await this.teamRepository.findAll({ userId })
		return teams
	}

	async updateDiscordServerId({ teamId, discordId }: { teamId: number; discordId: string }) {
		const team = await this.teamRepository.findOneById(teamId)
		if (!team) throw new BadRequestError('Cannot find your team!!!')

		team.discordServerId = discordId

		return this.teamRepository.save(team)
	}

	async linkDiscordServer(discordServerId: string) {
		const team = await this.teamRepository.findByDiscordServerId(discordServerId)
		if (!team) {
			return null
		}

		// Cập nhật trạng thái linked
		team.isDiscordServerLinked = true
		return this.teamRepository.save(team)
	}

	async findAllTeam() {
		const teams = await this.teamRepository.findAllTeam()
		return teams
	}
}

const teamService = new TeamService()
export { teamService, TeamService }
