import { BadRequestError } from '~/utils/error.reponse.js'
import { getUserByEmail, createUser } from './user.service.js'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { createTokenPair } from '~/utils/auth/auth.js'
import { SessionService } from './token.service.js'
import _ from 'lodash'

const sessionService = new SessionService()

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

	const token = createTokenPair(
		{
			userId: newUser.id,
			email: newUser.email
		},
		accessKey,
		refreshKey
	)

	if (!token) throw new BadRequestError('Create token failed')

	const newUserWithToken = sessionService.upsertSession({
		userId: newUser.id,
		accessKey: accessKey,
		refreshKey: refreshKey,
		refreshToken: token.refreshToken
	})
	if (!newUserWithToken) throw new BadRequestError('Create token row failed!')

	const resUser = _.pick(newUser, ['id', 'email'])
	return { user: resUser, token }
}

const login = async (email: string, password: string) => {
	const existingUser = await getUserByEmail(email)
	if (!existingUser) {
		throw new BadRequestError('User does not exist')
	}

	const isPasswordValid = await bcrypt.compare(password, existingUser.password)
	if (!isPasswordValid) {
		throw new BadRequestError('Invalid password')
	}

	const accessKey = randomBytes(16).toString('hex')
	const refreshKey = randomBytes(16).toString('hex')

	const token = createTokenPair(
		{
			userId: existingUser.id,
			email: existingUser.email
		},
		accessKey,
		refreshKey
	)

	if (!token) throw new BadRequestError('Create token failed')

	const newUserWithToken = sessionService.upsertSession({
		userId: existingUser.id,
		accessKey: accessKey,
		refreshKey: refreshKey,
		refreshToken: token.refreshToken
	})
	if (!newUserWithToken) throw new BadRequestError('Create token row failed!')

	const resUser = _.pick(existingUser, ['id', 'email'])
	return { user: resUser, token }
}

export { register, login }
