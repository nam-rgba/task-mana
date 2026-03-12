import { AppDataSource } from '~/db/data-source.js'
import { Skill } from '~/model/skill.entity.js'
import { UserSkill } from '~/model/user-skill.entity.js'

const normalizeSkill = (value: string) => value.trim().toLowerCase()

export const getSkillRepository = () => {
	const skillRepo = AppDataSource.getRepository(Skill)
	const userSkillRepo = AppDataSource.getRepository(UserSkill)

	const findAllDistinct = async (): Promise<string[]> => {
		const skills = await skillRepo.find({
			order: { name: 'ASC' }
		})
		return skills.map((s) => s.name)
	}

	const upsertSkill = async (name: string): Promise<Skill> => {
		const normalized = normalizeSkill(name)
		let skill = await skillRepo
			.createQueryBuilder('skill')
			.where('LOWER(skill.name) = :normalized', { normalized })
			.getOne()
		if (!skill) {
			skill = skillRepo.create({ name })
			skill = await skillRepo.save(skill)
		}
		return skill
	}

	const syncUserSkills = async (userId: number, skillNames: string[]): Promise<void> => {
		const dedupedByNormalized = new Map<string, string>()
		for (const rawName of skillNames) {
			const trimmedName = rawName.trim()
			if (!trimmedName) continue
			dedupedByNormalized.set(normalizeSkill(trimmedName), trimmedName)
		}

		const normalizedSkills = Array.from(dedupedByNormalized.values())

		// Clear existing user skills
		await userSkillRepo.delete({ userId })

		// Upsert each skill and create join record
		for (const skillName of normalizedSkills) {
			const skill = await upsertSkill(skillName)
			const userSkill = userSkillRepo.create({
				userId,
				skillName: skill.name
			})
			await userSkillRepo.save(userSkill)
		}
	}

	const getUserSkills = async (userId: number): Promise<string[]> => {
		const userSkills = await userSkillRepo.find({
			where: { userId },
			order: { skillName: 'ASC' }
		})
		return userSkills.map((us) => us.skillName)
	}

	return {
		findAllDistinct,
		upsertSkill,
		syncUserSkills,
		getUserSkills
	}
}
