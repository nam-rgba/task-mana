import { PrismaClient } from '@prisma/client'

declare global {
	// tránh lỗi khi chạy lại server trong môi trường phát triển
	// vì prisma client không thể khởi tạo lại nhiều lần
	// xem thêm: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#prevent-hot-reloading-from-creating-new-connections
	var prisma: PrismaClient | undefined
}

export const prisma =
	global.prisma ||
	new PrismaClient({
		log: ['query', 'info', 'warn', 'error']
	})

if (process.env.NODE_ENV !== 'production') global.prisma = prisma
