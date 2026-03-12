import { Entity, ManyToOne, JoinColumn, PrimaryColumn, CreateDateColumn } from 'typeorm'
import { User } from './user.entity.js'
import { Skill } from './skill.entity.js'

@Entity('user_skills')
export class UserSkill {
	@PrimaryColumn({ type: 'int' })
	userId: number

	@PrimaryColumn({ type: 'varchar', length: 20 })
	skillName: string

	@ManyToOne(() => User, (user) => user.userSkills, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'userId' })
	user: Awaited<User>

	@ManyToOne(() => Skill, (skill) => skill.userSkills, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'skillName' })
	skill: Awaited<Skill>

	@CreateDateColumn({ type: 'timestamptz' })
	createdAt: Date
}
