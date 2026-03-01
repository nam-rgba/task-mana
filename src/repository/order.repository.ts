import { AppDataSource } from '~/db/data-source.js'
import { Order } from '~/model/order.entity.js'
import { OrderStatus } from '~/model/enums/billing.enum.js'

export const getOrderRepository = () => {
	const repo = AppDataSource.getRepository(Order)

	const findOneById = async (id: number): Promise<Order | null> => {
		return await repo.findOne({
			where: { id },
			relations: ['plan', 'user']
		})
	}

	const findOneByOrderCode = async (orderCode: string): Promise<Order | null> => {
		return await repo.findOne({
			where: { orderCode },
			relations: ['plan', 'user']
		})
	}

	const findOneByVnpTxnRef = async (vnpTxnRef: string): Promise<Order | null> => {
		return await repo.findOne({
			where: { vnpTxnRef },
			relations: ['plan']
		})
	}

	const findByUserId = async (
		userId: number,
		page?: number,
		limit?: number
	): Promise<{ data: Order[]; total: number }> => {
		const [data, total] = await repo.findAndCount({
			where: { userId },
			relations: ['plan'],
			order: { createdAt: 'DESC' },
			skip: page && limit ? (page - 1) * limit : undefined,
			take: limit
		})
		return { data, total }
	}

	const findAll = async (page?: number, limit?: number): Promise<{ data: Order[]; total: number }> => {
		const [data, total] = await repo.findAndCount({
			relations: ['plan', 'user'],
			order: { createdAt: 'DESC' },
			skip: page && limit ? (page - 1) * limit : undefined,
			take: limit
		})
		return { data, total }
	}

	const create = async (data: Partial<Order>): Promise<Order> => {
		const order = repo.create(data)
		return await repo.save(order)
	}

	const update = async (id: number, data: Partial<Order>): Promise<Order | null> => {
		const order = await repo.findOneBy({ id })
		if (!order) return null
		Object.assign(order, data)
		return await repo.save(order)
	}

	/**
	 * Get revenue statistics by month/year
	 */
	const getRevenueStats = async (year: number): Promise<{ month: number; revenue: number; orderCount: number }[]> => {
		const result = await repo
			.createQueryBuilder('order')
			.select('EXTRACT(MONTH FROM order.paidAt)', 'month')
			.addSelect('SUM(order.amount)', 'revenue')
			.addSelect('COUNT(order.id)', 'orderCount')
			.where('order.status = :status', { status: OrderStatus.PAID })
			.andWhere('EXTRACT(YEAR FROM order.paidAt) = :year', { year })
			.groupBy('EXTRACT(MONTH FROM order.paidAt)')
			.orderBy('month', 'ASC')
			.getRawMany()

		return result.map((row) => ({
			month: Number(row.month),
			revenue: Number(row.revenue) || 0,
			orderCount: Number(row.orderCount) || 0
		}))
	}

	/**
	 * Get revenue by plan
	 */
	const getRevenueByPlan = async (
		year: number,
		month?: number
	): Promise<{ planId: number; planName: string; revenue: number; orderCount: number }[]> => {
		let query = repo
			.createQueryBuilder('order')
			.leftJoinAndSelect('order.plan', 'plan')
			.select('order.planId', 'planId')
			.addSelect('plan.displayName', 'planName')
			.addSelect('SUM(order.amount)', 'revenue')
			.addSelect('COUNT(order.id)', 'orderCount')
			.where('order.status = :status', { status: OrderStatus.PAID })
			.andWhere('EXTRACT(YEAR FROM order.paidAt) = :year', { year })

		if (month) {
			query = query.andWhere('EXTRACT(MONTH FROM order.paidAt) = :month', { month })
		}

		const result = await query.groupBy('order.planId').addGroupBy('plan.displayName').getRawMany()

		return result.map((row) => ({
			planId: Number(row.planId),
			planName: row.planName,
			revenue: Number(row.revenue) || 0,
			orderCount: Number(row.orderCount) || 0
		}))
	}

	/**
	 * Get total stats summary
	 */
	const getTotalStats = async (): Promise<{
		totalRevenue: number
		totalOrders: number
		totalPaidOrders: number
		totalPendingOrders: number
		totalFailedOrders: number
		totalRefundedOrders: number
	}> => {
		const [totalRevenue, totalOrders, statusCounts] = await Promise.all([
			repo
				.createQueryBuilder('order')
				.select('SUM(order.amount)', 'total')
				.where('order.status = :status', { status: OrderStatus.PAID })
				.getRawOne(),
			repo.count(),
			repo
				.createQueryBuilder('order')
				.select('order.status', 'status')
				.addSelect('COUNT(order.id)', 'count')
				.groupBy('order.status')
				.getRawMany()
		])

		const statusMap = statusCounts.reduce(
			(acc, row) => {
				acc[row.status] = Number(row.count)
				return acc
			},
			{} as Record<string, number>
		)

		return {
			totalRevenue: Number(totalRevenue?.total) || 0,
			totalOrders,
			totalPaidOrders: statusMap[OrderStatus.PAID] || 0,
			totalPendingOrders: statusMap[OrderStatus.PENDING] || 0,
			totalFailedOrders: statusMap[OrderStatus.FAILED] || 0,
			totalRefundedOrders: statusMap[OrderStatus.REFUNDED] || 0
		}
	}

	/**
	 * Get recent orders
	 */
	const getRecentOrders = async (limit: number = 10): Promise<Order[]> => {
		return await repo.find({
			relations: ['plan', 'user'],
			order: { createdAt: 'DESC' },
			take: limit
		})
	}

	return {
		findOneById,
		findOneByOrderCode,
		findOneByVnpTxnRef,
		findByUserId,
		findAll,
		create,
		update,
		getRevenueStats,
		getRevenueByPlan,
		getTotalStats,
		getRecentOrders
	}
}
