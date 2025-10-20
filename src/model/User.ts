import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Position } from '~/types/position.type.js'

@Entity('users')
export class User {
	@PrimaryGeneratedColumn()
	id: number

	@Column({ type: 'varchar', length: 225, unique: true })
	email: string

	@Column({ type: 'varchar' })
	password: string

	@Column({ type: 'varchar', default: '' })
	name: string

	@Column({ type: 'varchar', nullable: true })
	avatar: string

	@Column({ type: 'varchar', nullable: true })
	position: Position

	@CreateDateColumn()
	createdAt!: Date

	@UpdateDateColumn()
	updatedAt!: Date
}
