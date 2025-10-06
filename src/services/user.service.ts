import { User } from '~/model/User.js'
import { getUserRepository } from '~/repository/user.repository.js'

const userRepo = getUserRepository()

const { findOne, create } = userRepo

export const getUserByEmail = async (email: string): Promise<User | null> => {
	return await findOne({ email })
}

export const getUserById = async (id: number): Promise<User | null> => {
	return await findOne({ id })
}

export const createUser = async (data: { email: string; password: string }): Promise<User> => {
	return await create({
		...data
	})
}
