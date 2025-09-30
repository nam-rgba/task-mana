export interface User {
	id: string
	email: string
	password: string
	role: 'USER' | 'ADMIN'
	name?: string | null
	createdAt: Date
}
