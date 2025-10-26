import { Position } from './position.type.js'

export interface User {
	id: number
	email: string
	password: string
	role: 'USER' | 'ADMIN'
	avatar?: string | null
	position: Position
	yearOfExperience: number
	name?: string | null
	createdAt: Date
}
