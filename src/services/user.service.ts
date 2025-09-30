import { findOne, create } from '~/repository/user.repository.js'
import { User } from '~/db/generated/prisma/index.js'

export const getUserByEmail = async (email: string): Promise<User | null> => {
	return await findOne({ email })
}

export const getUserById = async (id: number): Promise<User | null> => {
	return await findOne({ id })
}

export const createUser = async (data: { email: string; password: string }): Promise<User> => {
	return await create({
		...data,
		role: 'USER'
	})
}
