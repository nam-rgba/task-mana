import { Token } from '~/model/token.entity.js'
import { TokenRepository } from '~/repository/token.repository.js'

const sessionRepo = new TokenRepository()

export class SessionService {
	async upsertSession(payload: {
		userId: number
		accessKey: string
		refreshKey: string
		refreshToken: string
	}): Promise<Token | null> {
		return await sessionRepo.createOrUpdateToken(payload)
	}

	async getAccessKey(userId: number): Promise<string | null> {
		return await sessionRepo.findAccessKey(userId)
	}

	async removeSession(userId: number): Promise<number> {
		return await sessionRepo.removeKey(userId)
	}
}
