import 'reflect-metadata'
import dotenv from 'dotenv'
dotenv.config()

import { AppDataSource } from '../db/data-source.js'
import { getPlanRepository } from '~/repository/plan.repository.js'
import { PlanName } from '~/model/enums/billing.enum.js'

const plans = [
	{
		name: PlanName.FREE,
		displayName: 'Free',
		description: 'Dành cho team nhỏ, bắt đầu miễn phí với các tính năng cơ bản.',
		monthlyPrice: 0,
		yearlyPrice: 0,
		maxMembers: 5,
		maxProjects: 3,
		maxStorage: 500,
		features: {
			aiAssistant: false,
			advancedAnalytics: false,
			prioritySupport: false,
			customBranding: false,
			apiAccess: false,
			exportReports: false
		},
		isActive: true
	},
	{
		name: PlanName.PRO,
		displayName: 'Pro',
		description: 'Dành cho team chuyên nghiệp, nhiều tính năng nâng cao và hỗ trợ ưu tiên.',
		monthlyPrice: 299000,
		yearlyPrice: 2990000,
		maxMembers: 25,
		maxProjects: 20,
		maxStorage: 5000,
		features: {
			aiAssistant: true,
			advancedAnalytics: true,
			prioritySupport: false,
			customBranding: false,
			apiAccess: true,
			exportReports: true
		},
		isActive: true
	},
	{
		name: PlanName.ENTERPRISE,
		displayName: 'Enterprise',
		description: 'Dành cho doanh nghiệp lớn, không giới hạn và hỗ trợ đặc biệt.',
		monthlyPrice: 999000,
		yearlyPrice: 9990000,
		maxMembers: 999,
		maxProjects: 999,
		maxStorage: 50000,
		features: {
			aiAssistant: true,
			advancedAnalytics: true,
			prioritySupport: true,
			customBranding: true,
			apiAccess: true,
			exportReports: true
		},
		isActive: true
	}
]

async function seedPlans() {
	try {
		console.log('🔌 Đang kết nối database...')
		await AppDataSource.initialize()
		console.log('✅ Đã kết nối database thành công')

		const repo = getPlanRepository()

		console.log(`📝 Đang seed ${plans.length} plans...`)

		for (const planData of plans) {
			const existing = await repo.findOneByName(planData.name)
			if (existing) {
				console.log(`   ⏭️  Plan "${planData.displayName}" đã tồn tại, bỏ qua.`)
				continue
			}
			await repo.create(planData)
			console.log(`   ✅ Đã tạo plan "${planData.displayName}"`)
		}

		console.log('\n📊 Danh sách plans:')
		const allPlans = await repo.findAll()
		for (const plan of allPlans) {
			const price =
				plan.monthlyPrice === 0
					? 'Miễn phí'
					: `${plan.monthlyPrice.toLocaleString('vi-VN')}đ/tháng | ${plan.yearlyPrice.toLocaleString('vi-VN')}đ/năm`
			console.log(`   - ${plan.displayName}: ${price} (max ${plan.maxMembers} members, ${plan.maxProjects} projects)`)
		}

		await AppDataSource.destroy()
		console.log('\n✅ Hoàn tất seed plans!')
		process.exit(0)
	} catch (error) {
		console.error('❌ Lỗi khi seed plans:', error)
		process.exit(1)
	}
}

seedPlans()
