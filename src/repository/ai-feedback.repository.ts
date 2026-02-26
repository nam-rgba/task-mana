import { AppDataSource } from '~/db/data-source.js'
import { AiFeedback } from '~/model/ai-feedback.entity.js'
import { FeedbackStatus, FeedbackValue, AiActionType } from '~/model/enums/ai-feedback.enum.js'
import { AiFeedbackQuery, AiFeedbackStats } from '~/types/ai-feedback.type.js'

export function getAiFeedbackRepository() {
	const repo = AppDataSource.getRepository(AiFeedback)

	return repo.extend({
		async findById(id: number): Promise<AiFeedback | null> {
			return repo.findOne({ where: { id } })
		},

		async findWithFilters(query: AiFeedbackQuery): Promise<[AiFeedback[], number]> {
			const {
				projectId,
				taskId,
				userId,
				actionType,
				feedback,
				feedbackSource,
				status,
				fromDate,
				toDate,
				page = 1,
				limit = 20
			} = query

			const qb = repo
				.createQueryBuilder('af')
				.leftJoinAndSelect('af.user', 'user')
				.leftJoinAndSelect('af.project', 'project')
				.leftJoinAndSelect('af.task', 'task')

			if (projectId) qb.andWhere('af.projectId = :projectId', { projectId })
			if (taskId) qb.andWhere('af.taskId = :taskId', { taskId })
			if (userId) qb.andWhere('af.userId = :userId', { userId })
			if (actionType) qb.andWhere('af.actionType = :actionType', { actionType })
			if (feedback) qb.andWhere('af.feedback = :feedback', { feedback })
			if (feedbackSource) qb.andWhere('af.feedbackSource = :feedbackSource', { feedbackSource })
			if (status) qb.andWhere('af.status = :status', { status })
			if (fromDate) qb.andWhere('af.createdAt >= :fromDate', { fromDate: new Date(fromDate) })
			if (toDate) qb.andWhere('af.createdAt <= :toDate', { toDate: new Date(toDate) })

			qb.orderBy('af.createdAt', 'DESC')
				.skip((page - 1) * limit)
				.take(limit)

			return qb.getManyAndCount()
		},

		/**
		 * Stats tổng hợp theo actionType trong một project
		 */
		async getStatsByProject(projectId: number): Promise<AiFeedbackStats[]> {
			const rows = await repo
				.createQueryBuilder('af')
				.select('af.actionType', 'actionType')
				.addSelect('COUNT(*)', 'total')
				.addSelect(`SUM(CASE WHEN af.feedback = '${FeedbackValue.POSITIVE}' THEN 1 ELSE 0 END)`, 'positive')
				.addSelect(`SUM(CASE WHEN af.feedback = '${FeedbackValue.NEGATIVE}' THEN 1 ELSE 0 END)`, 'negative')
				.addSelect(`SUM(CASE WHEN af.status = '${FeedbackStatus.PENDING}' THEN 1 ELSE 0 END)`, 'pending')
				.where('af.projectId = :projectId', { projectId })
				.groupBy('af.actionType')
				.getRawMany()

			return rows.map((r) => ({
				actionType: r.actionType as AiActionType,
				total: Number(r.total),
				positive: Number(r.positive),
				negative: Number(r.negative),
				pending: Number(r.pending),
				acceptanceRate:
					Number(r.positive) + Number(r.negative) > 0
						? Number(r.positive) / (Number(r.positive) + Number(r.negative))
						: 0
			}))
		},

		/**
		 * Expire các record PENDING quá hạn (dùng cho cron job)
		 */
		async expireOldPending(olderThanMs: number): Promise<number> {
			const cutoff = new Date(Date.now() - olderThanMs)
			const result = await repo
				.createQueryBuilder()
				.update(AiFeedback)
				.set({ status: FeedbackStatus.EXPIRED })
				.where('status = :status', { status: FeedbackStatus.PENDING })
				.andWhere('createdAt < :cutoff', { cutoff })
				.execute()
			return result.affected ?? 0
		}
	})
}
