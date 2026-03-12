import axios from 'axios'
import crypto from 'crypto'
import { AppDataSource } from '~/db/data-source.js'
import { ApiProvider, Geminimodelname, Groqmodelname } from '~/model/api-key.entity.js'
import { User } from '~/model/user.entity.js'
import { getApiKeyRepository } from '~/repository/api-key.repository.js'
import { getUsageRepository } from '~/repository/usage.repository.js'
import { BadRequestError, NotFoundError } from '~/utils/error.reponse.js'

const ALGORITHM = 'aes-256-gcm'

function getEncryptionSecret(): string {
	const secret = process.env.API_KEY_ENCRYPTION_SECRET || process.env.JWT_SECRET
	if (!secret) {
		throw new Error('Missing API_KEY_ENCRYPTION_SECRET (or JWT_SECRET) for API key encryption')
	}
	return secret
}

function encryptValue(value: string): string {
	const key = crypto.createHash('sha256').update(getEncryptionSecret()).digest()
	const iv = crypto.randomBytes(12)
	const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
	const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
	const authTag = cipher.getAuthTag()
	return `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted.toString('base64')}`
}

function decryptValue(payload: string): string {
	const [ivBase64, tagBase64, encryptedBase64] = payload.split('.')
	if (!ivBase64 || !tagBase64 || !encryptedBase64) {
		throw new Error('Invalid encrypted API key payload format')
	}

	const key = crypto.createHash('sha256').update(getEncryptionSecret()).digest()
	const iv = Buffer.from(ivBase64, 'base64')
	const authTag = Buffer.from(tagBase64, 'base64')
	const encrypted = Buffer.from(encryptedBase64, 'base64')

	const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
	decipher.setAuthTag(authTag)

	const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
	return decrypted.toString('utf8')
}

class ApiKeyService {
	private apiKeyRepo = getApiKeyRepository()
	private usageRepo = getUsageRepository()
	private userRepo = AppDataSource.getRepository(User)

	private async validateGroqApiKey(rawKey: string) {
		try {
			await axios.get('https://api.groq.com/openai/v1/models', {
				headers: {
					Authorization: `Bearer ${rawKey}`
				},
				timeout: 10_000
			})
		} catch {
			throw new BadRequestError('Groq API key is invalid or cannot be verified')
		}
	}

	async createApiKey(
		userId: number,
		payload: { name: string; key: string; provider?: ApiProvider; modelname?: Groqmodelname | Geminimodelname }
	) {
		const name = payload.name?.trim()
		const rawKey = payload.key?.trim()

		if (!name) throw new BadRequestError('Name is required')
		if (!rawKey) throw new BadRequestError('API key is required')

		await this.validateGroqApiKey(rawKey)

		const created = await this.apiKeyRepo.create({
			name,
			key: encryptValue(rawKey),
			provider: payload.provider || 'groq',
			isActive: true,
			modelname: payload.modelname,
			userId
		})

		return {
			id: created.id,
			name: created.name,
			provider: created.provider,
			modelname: created.modelname,
			isActive: created.isActive,
			userId: created.userId,
			createdAt: created.createdAt
		}
	}

	async listApiKeys(userId: number) {
		const user = await this.userRepo.findOne({ where: { id: userId }, select: ['id', 'selectedApiKeyId'] })
		const rows = await this.apiKeyRepo.findByUserIdWithUsage(userId)

		console.log('rowssss: ', rows)

		return rows.map((row: any) => ({
			id: Number(row.id),
			name: row.name,
			provider: row.provider,
			modelname: row.modelname,
			isActive: row.isActive,
			userId: Number(row.userId),
			createdAt: row.createdAt,
			totalTokensUsed: Number(row.totalTokensUsed || 0),
			isSelected: Number(row.id) === (user?.selectedApiKeyId ?? -1)
		}))
	}

	async updateApiKey(userId: number, id: number, payload: { name?: string; isActive?: boolean }) {
		const apiKey = await this.apiKeyRepo.findByIdAndUserId(id, userId)
		if (!apiKey) throw new NotFoundError('API key not found')

		if (payload.name !== undefined) {
			const normalized = payload.name.trim()
			if (!normalized) throw new BadRequestError('Name must not be empty')
			apiKey.name = normalized
		}

		if (payload.isActive !== undefined) {
			apiKey.isActive = payload.isActive
		}

		const updated = await this.apiKeyRepo.save(apiKey)

		if (!updated.isActive) {
			const user = await this.userRepo.findOne({ where: { id: userId }, select: ['id', 'selectedApiKeyId'] })
			if (user?.selectedApiKeyId === updated.id) {
				user.selectedApiKeyId = null
				await this.userRepo.save(user)
			}
		}

		return {
			id: updated.id,
			name: updated.name,
			provider: updated.provider,
			modelname: updated.modelname,
			isActive: updated.isActive,
			userId: updated.userId,
			createdAt: updated.createdAt
		}
	}

	async deleteApiKey(userId: number, id: number) {
		const apiKey = await this.apiKeyRepo.findByIdAndUserId(id, userId)
		if (!apiKey) throw new NotFoundError('API key not found')

		const user = await this.userRepo.findOne({ where: { id: userId }, select: ['id', 'selectedApiKeyId'] })
		if (user?.selectedApiKeyId === apiKey.id) {
			user.selectedApiKeyId = null
			await this.userRepo.save(user)
		}

		await this.apiKeyRepo.remove(apiKey)

		return { deleted: true }
	}

	async setSelectedApiKey(userId: number, selectedApiKeyId: number | null) {
		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) throw new NotFoundError('User not found')

		if (selectedApiKeyId === null) {
			user.selectedApiKeyId = null
			await this.userRepo.save(user)
			return { selectedApiKeyId: null }
		}

		const apiKey = await this.apiKeyRepo.findByIdAndUserId(selectedApiKeyId, userId)
		if (!apiKey) throw new NotFoundError('API key not found')
		if (!apiKey.isActive) throw new BadRequestError('Selected API key must be active')

		user.selectedApiKeyId = apiKey.id
		await this.userRepo.save(user)

		return { selectedApiKeyId: apiKey.id }
	}

	async getUsageList(userId: number, apiKeyId: number, page?: number, limit?: number) {
		const apiKey = await this.apiKeyRepo.findByIdAndUserId(apiKeyId, userId)
		if (!apiKey) throw new NotFoundError('API key not found')
		return this.usageRepo.findByApiKeyId(apiKeyId, { page, limit })
	}

	async getUsageOverview(userId: number, apiKeyId: number) {
		const apiKey = await this.apiKeyRepo.findByIdAndUserId(apiKeyId, userId)
		if (!apiKey) throw new NotFoundError('API key not found')
		const overview = await this.usageRepo.getOverviewByApiKeyId(apiKeyId)
		return {
			apiKeyId,
			apiKeyName: apiKey.name,
			...overview
		}
	}

	async resolveSelectedApiKeyForUser(userId: number): Promise<any | null> {
		const user = await this.userRepo.findOne({
			where: { id: userId },
			select: ['id', 'selectedApiKeyId']
		})

		if (!user?.selectedApiKeyId) return null

		const apiKey = await this.apiKeyRepo.findByIdAndUserId(user.selectedApiKeyId, userId)
		if (!apiKey || !apiKey.isActive) return null

		console.log('in api-key-s, resolveSelectedApiKeyForUser: ', apiKey)
		return {
			id: apiKey.id,
			decryptedKey: decryptValue(apiKey.key),
			provider: apiKey.provider,
			modelname: apiKey.modelname
		}
	}
}

export const apiKeyService = new ApiKeyService()
