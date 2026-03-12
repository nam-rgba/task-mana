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
import axios from 'axios'
import { AuthProvider } from '~/model/enums/auth-provider.enum.js'

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

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

const getGoogleAuthUrl = () => {
	const clientId = process.env.GG_OAUTH_CLIENT_ID
	const redirectUri = process.env.GG_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'

	const params = new URLSearchParams({
		client_id: clientId!,
		redirect_uri: redirectUri,
		response_type: 'code',
		scope: 'email profile',
		access_type: 'offline',
		prompt: 'consent'
	})

	return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

const googleLogin = async (code: string) => {
	const clientId = process.env.GG_OAUTH_CLIENT_ID
	const clientSecret = process.env.GG_OAUTH_CLIENT_SECRET
	const redirectUri = process.env.GG_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'

	const tokenResponse = await axios.post(GOOGLE_TOKEN_URL, {
		code,
		client_id: clientId,
		client_secret: clientSecret,
		redirect_uri: redirectUri,
		grant_type: 'authorization_code'
	})

	const { access_token } = tokenResponse.data

	const userInfoResponse = await axios.get(GOOGLE_USERINFO_URL, {
		headers: { Authorization: `Bearer ${access_token}` }
	})

	const { email, name, picture } = userInfoResponse.data

	if (!email) throw new BadRequestError('Cannot get email from Google')

	let user = await getUserByEmail(email)

	if (!user || !user.id) {
		const newUser = await createUser({
			email,
			name: name || '',
			password: null,
			avatar: picture || null,
			isEmailVerified: true,
			authProvider: AuthProvider.GOOGLE
		} as any)
		user = { ...newUser, skills: [], lastTeamId: undefined }
	} else {
		if (!user.avatar && picture) {
			await updateUser(user.id, { avatar: picture })
			user.avatar = picture
		}
	}

	const accessKey = randomBytes(16).toString('hex')
	const refreshKey = randomBytes(16).toString('hex')

	const token = createTokenPair(
		{
			userId: user.id,
			email: user.email
		},
		accessKey,
		refreshKey
	)

	if (!token) throw new BadRequestError('Create token failed')

	const newUserWithToken = sessionService.upsertSession({
		userId: user.id!,
		accessKey: accessKey,
		refreshKey: refreshKey,
		refreshToken: token.refreshToken
	})
	if (!newUserWithToken) throw new BadRequestError('Create token row failed!')

	const resUser = _.pick(user, ['id', 'email', 'avatar', 'name'])
	return { user: resUser, token }
}

export { register, login, verifyEmail, getGoogleAuthUrl, googleLogin }
