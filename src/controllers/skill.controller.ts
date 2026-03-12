import { Request, Response } from 'express'
import { getSkillRepository } from '~/repository/skill.repository.js'
import { SuccessResponse } from '~/utils/success.response.js'

class SkillController {
	getAllSkills = async (req: Request, res: Response) => {
		const skills = await getSkillRepository().findAllDistinct()

		new SuccessResponse({
			message: 'Get all skills successfully',
			statusCode: 200,
			metadata: {
				skills,
				total: skills.length
			}
		}).send(res)
	}
}

export { SkillController }
