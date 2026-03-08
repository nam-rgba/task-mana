import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { AppBaseEntity } from './base.entity.js'

export enum OtpTokenType {
	VERIFY_EMAIL = 'VERIFY_EMAIL',
	RESET_PASSWORD = 'RESET_PASSWORD',
	TEAM_INVITE = 'TEAM_INVITE'
}

@Entity('Token')
export class otp {
	@PrimaryGeneratedColumn()
	id: number

	@Column({ type: 'enum', enum: OtpTokenType })
	type: OtpTokenType

	@Column({ type: 'varchar', unique: true })
	token: string

	@Column({ type: 'varchar' })
	email: string

	@Column({ type: 'int', nullable: true })
	userId: number | null

	@Column({ type: 'int', nullable: true })
	teamId: number | null

	@Column({ type: 'timestamp' })
	expiresAt: Date

	@Column({ type: 'timestamp', nullable: true })
	usedAt: Date | null

	@Column({ type: 'timestamp' })
	createdAt: Date
}
