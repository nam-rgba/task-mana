import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class Token {
	@PrimaryGeneratedColumn()
	id: number

	@Column({ type: 'int' })
	userId: number

	@Column({ type: 'varchar', length: 255 })
	accessKey: string

	@Column({ type: 'varchar', length: 255 })
	refreshKey: string

	@Column({ type: 'text' })
	refreshToken: string

	@CreateDateColumn()
	createdAt: Date

	@UpdateDateColumn()
	updatedAt: Date
}
