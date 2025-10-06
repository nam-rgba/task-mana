import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('users')
export class User {
	@PrimaryGeneratedColumn()
	id: number

	@Column({ type: 'varchar', length: 225, unique: true })
	email: string

	@Column({ type: 'varchar' })
	password: string

	@CreateDateColumn()
	createdAt!: Date

	@UpdateDateColumn()
	updatedAt!: Date
}
