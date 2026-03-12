import { Entity, PrimaryColumn, CreateDateColumn, OneToMany } from 'typeorm'
import { UserSkill } from './user-skill.entity.js'

@Entity('skills')
export class Skill {
	@PrimaryColumn({ type: 'varchar', length: 20 })
	name: string

	@OneToMany(() => UserSkill, (us) => us.skill, { onDelete: 'CASCADE' })
	userSkills: Awaited<UserSkill[]>

	@CreateDateColumn({ type: 'timestamptz' })
	createdAt: Date
}
