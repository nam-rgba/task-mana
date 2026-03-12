import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	OneToMany,
	JoinColumn,
	CreateDateColumn,
	UpdateDateColumn
} from 'typeorm'
import { User } from './user.entity.js'
import { Usage } from './usage.entity.js'

@Entity('api_keys')
export class ApiKey {
	@PrimaryGeneratedColumn()
	id: number

	@Column({ type: 'varchar', length: 225 })
	name: string

	@Column({ type: 'text' })
	key: string

	@Column({ type: 'varchar', length: 50, default: 'groq' })
	provider: string

	@Column({ type: 'boolean', default: true })
	isActive: boolean

	@Column({ type: 'int' })
	userId: number

	@ManyToOne(() => User, (user) => user.apiKeys, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'userId' })
	user: Awaited<User>

	@OneToMany(() => Usage, (usage) => usage.apiKey)
	usages: Awaited<Usage[]>

	@CreateDateColumn({ type: 'timestamptz' })
	createdAt!: Date

	@UpdateDateColumn({ type: 'timestamptz' })
	updatedAt!: Date
}
