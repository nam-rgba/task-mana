interface ITokenPayload {
	userId: number
	accessKey: number
	refreshKey: number
	refreshToken: string
}

const createNewToken = async ({ userId, accessKey, refreshKey, refreshToken }: ITokenPayload) => {
	try {
		const keyUpdated = await prisma.session.upsert({
			where: { userId },
			update: { accessKey, refreshKey, token: refreshToken },
			create: { userId, accessKey, refreshKey, token: refreshToken }
		})
		return keyUpdated ?? null
	} catch (error) {
		console.error('Error creating new token:', error)
		throw new Error('Failed to create new token')
	}
}

const findAccessKey = async (userId: number) => {
	return await prisma.session.findUnique({
		where: { userId },
		select: { accessKey: true }
	})
}

const removeKey = async (userId: number) => {
	return await prisma.session.deleteMany({
		where: { userId }
	})
}

export { createNewToken, findAccessKey, removeKey }
