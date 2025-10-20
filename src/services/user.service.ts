import { User } from '~/model/User.js'
import { getUserRepository } from '~/repository/user.repository.js'

const userRepo = getUserRepository()

export interface IGetAllUsersOptions {
	page?: number
	limit?: number
	skip?: number
	query?: Record<string, any>
}
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

export const updateUser = async (id: number, data: Partial<User>): Promise<User | null> => {
	return await userRepo.update(id, data)
}

export const getAllUsers = async ({ page = 1, limit = 10, query }: IGetAllUsersOptions) => {
	return await userRepo.findAll({
		page,
		limit,
		query
	})
}
