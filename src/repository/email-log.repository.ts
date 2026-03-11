import { AppDataSource } from '~/db/data-source.js'
import { EmailLog } from '~/model/email-log.entity.js'

export const getEmailLogRepository = () => {
	const repo = AppDataSource.getRepository(EmailLog)

	const create = async (data: Partial<EmailLog>): Promise<EmailLog> => {
		const emailLog = repo.create(data)
		return await repo.save(emailLog)
	}

	return {
		create
	}
}
