import { BadRequestError } from '~/utils/error.reponse.js'
import { getUserByEmail, createUser } from './user.service.js'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

const register = async (email: string, password: string) => {
	// step 1: find if user exists
	const existingUser = await getUserByEmail(email)

	if (existingUser) {
		throw new BadRequestError('User already exists')
	}

	//  step 2: hash password
	const hashedPassword = await bcrypt.hashSync(password, 10)

	// step 3: create user
	const newUser = await createUser({ email, password: hashedPassword })

	// step 4:token setting
	if (!newUser) throw new BadRequestError('Create user failed')

	const accessKey = randomBytes(16).toString('hex')
	const refreshKey = randomBytes(16).toString('hex')
}
