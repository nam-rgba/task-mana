import { AppDataSource } from '~/db/data-source.js'
import { otp } from '~/model/otp.entity.js'

export const getOtpRepository = () => {
	const repo = AppDataSource.getRepository(otp)

	const findOneByEmail = async (email: string): Promise<otp | null> => {
		return await repo.findOneBy({ email })
	}

	const findoneByToken = async (token: string): Promise<otp | null> => {
		return await repo.findOneBy({ token })
	}

	const create = async (data: Partial<otp>): Promise<otp> => {
		const otpEntity = repo.create(data)
		return await repo.save(otpEntity)
	}

	return {
		findOneByEmail,
		create,
		findoneByToken
	}
}
