import { BadRequestError } from '~/utils/error.reponse.js'
import { getUserByEmail, createUser, checkRegistedEmail, updateUser } from './user.service.js'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { createTokenPair } from '~/utils/auth/auth.js'
import { SessionService } from './token.service.js'
import _ from 'lodash'
import { sendVerificationEmail, sendWelcomeEmail } from './email/auth-email.service.js'
import { getOtpRepository } from '~/repository/otp.repository.js'
import { OtpTokenType } from '~/model/otp.entity.js'

const sessionService = new SessionService()

const otpRepo = getOtpRepository()

const register = async (email: string, name: string, password: string) => {
	// step 1: find if user exists
	const existingUser = await checkRegistedEmail(email)

	if (existingUser) {
		throw new BadRequestError('User already exists')
	}

	//  step 2: hash password
	const hashedPassword = await bcrypt.hashSync(password, 10)

	// step 3: create user
	const newUser = await createUser({ email, password: hashedPassword, name })

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

	const otptoken = await otpRepo.create({
		email: newUser.email,
		token: randomBytes(16).toString('hex'),
		expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // expires in 1 hours
		type: OtpTokenType.VERIFY_EMAIL,
		userId: newUser.id,
		createdAt: new Date()
	})

	if (!otptoken) throw new BadRequestError('Create otp token failed!')

	await sendVerificationEmail(newUser.email, newUser.name!, otptoken.token)

	return { user: resUser, token }
}

const login = async (email: string, password: string) => {
	const existingUser = await getUserByEmail(email)
	if (!existingUser) {
		throw new BadRequestError('Email or password is incorrect')
	}

	const isPasswordValid = await bcrypt.compare(password, existingUser.password!)
	if (!isPasswordValid) {
		throw new BadRequestError('Email or password is incorrect')
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
		userId: existingUser.id!,
		accessKey: accessKey,
		refreshKey: refreshKey,
		refreshToken: token.refreshToken
	})
	if (!newUserWithToken) throw new BadRequestError('Create token row failed!')

	const resUser = _.pick(existingUser, ['id', 'email', 'avatar', 'name'])
	return { user: resUser, token }
}

const verifyEmail = async (token: string) => {
	const otpRecord = await otpRepo.findoneByToken(token)
	if (!otpRecord) {
		throw new BadRequestError('Invalid or expired token')
	}

	if (otpRecord.expiresAt < new Date()) {
		throw new BadRequestError('Token has expired')
	}

	const user = await getUserByEmail(otpRecord.email)
	if (!user) {
		throw new BadRequestError('User not found')
	}

	user.isEmailVerified = true
	await updateUser(user.id!, { isEmailVerified: true })

	return user
}

export { register, login, verifyEmail }
