import 'reflect-metadata'
import dotenv from 'dotenv'
dotenv.config()

import { AppDataSource } from '../db/data-source.js'
import seedData from '../db/seed.json' with { type: 'json' }
import { getTaskRepository } from '~/repository/task.repository.js'
import { QCReviewStatus, TaskStatus, TaskType } from '~/types/task.type.js'

async function seed() {
	try {
		console.log('🔌 Đang kết nối database...')
		await AppDataSource.initialize()
		console.log('✅ Đã kết nối database thành công')

		const repo = getTaskRepository()

		console.log(`📝 Đang seed ${seedData.length} tasks...`)

		for (const taskData of seedData) {
			await repo.create({
				title: taskData.title,
				description: taskData.description,
				status: taskData.status as TaskStatus,
				type: taskData.type as TaskType,
				projectId: taskData.projectId,
				priority: taskData.priority,
				estimateEffort: taskData.estimateEffort,
				actualEffort: taskData.actualEffort,
				score: taskData.score,
				assigneeId: taskData.assigneeId,
				reviewerId: taskData.reviewerId,
				dueDate: taskData.dueDate,
				completedAt: taskData.completedAt,
				qcReviewStatus: taskData.qcReviewStatus as QCReviewStatus,
				qcNote: taskData.qcNote,
				completedPercent: taskData.completedPercent
			})
		}

		console.log('✅ Đã seed thành công tất cả tasks')
		console.log(`📊 Tổng số tasks đã tạo: ${seedData.length}`)

		// Hiển thị thống kê
		const stats = {
			total: seedData.length,
			done: seedData.filter((t) => t.status === 'DONE').length,
			features: seedData.filter((t) => t.type === 'FEATURE').length,
			bugs: seedData.filter((t) => t.type === 'BUG').length,
			passed: seedData.filter((t) => t.qcReviewStatus === 'PASS').length,
			failed: seedData.filter((t) => t.qcReviewStatus === 'FAIL').length
		}

		console.log('\n📊 Thống kê:')
		console.log(`   - Tổng tasks: ${stats.total}`)
		console.log(`   - Hoàn thành: ${stats.done}`)
		console.log(`   - Features: ${stats.features}`)
		console.log(`   - Bugs: ${stats.bugs}`)
		console.log(`   - QC Pass: ${stats.passed}`)
		console.log(`   - QC Fail: ${stats.failed}`)

		await AppDataSource.destroy()
		console.log('\n✅ Hoàn tất!')
		process.exit(0)
	} catch (error) {
		console.error('❌ Lỗi khi seed data:', error)
		process.exit(1)
	}
}

seed()
