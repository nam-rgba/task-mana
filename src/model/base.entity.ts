import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm'

export abstract class AppBaseEntity {
	@PrimaryGeneratedColumn()
	id: number

	@CreateDateColumn({ type: 'timestamptz' })
	createdAt: Date

	@UpdateDateColumn({ type: 'timestamptz' })
	updatedAt: Date

	@DeleteDateColumn({ type: 'timestamptz', nullable: true })
	deletedAt?: Date | null
}
