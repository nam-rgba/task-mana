import 'reflect-metadata'
import dotenv from 'dotenv'
dotenv.config()

import { AppDataSource } from '../db/data-source.js'
import { Schedule } from '~/model/schedule.entity.js'
import { Task } from '~/model/task.entity.js'
import { ScheduleStatus } from '~/model/enums/gantt.enum.js'
import { TaskStatus, TaskPriority, TaskType } from '~/types/task.type.js'

const PROJECT_ID = 7

// Helper: tạo unix timestamp (seconds) từ ngày
const ts = (year: number, month: number, day: number) => Math.floor(new Date(year, month - 1, day).getTime() / 1000)

const schedules = [
	{
		name: 'Sprint 1 - Khởi tạo dự án & Thiết kế hệ thống',
		description: 'Setup project, thiết kế DB, wireframe UI, chuẩn bị môi trường dev',
		startDate: ts(2026, 3, 1),
		endDate: ts(2026, 3, 14),
		status: ScheduleStatus.COMPLETED,
		color: '#22c55e',
		sortOrder: 0,
		tasks: [
			{
				title: 'Thiết kế database schema (ERD)',
				description: 'Thiết kế bảng User, Project, Task, Team, TeamMember và các quan hệ',
				status: TaskStatus.Done,
				type: TaskType.Research,
				priority: TaskPriority.High,
				startDate: ts(2026, 3, 1),
				dueDate: ts(2026, 3, 3),
				duration: 2,
				completedPercent: 100,
				sortOrder: 0
			},
			{
				title: 'Setup project backend (Express + TypeORM)',
				description: 'Khởi tạo project Express, cài TypeORM, cấu hình PostgreSQL, ESLint, Prettier',
				status: TaskStatus.Done,
				type: TaskType.Feature,
				priority: TaskPriority.High,
				startDate: ts(2026, 3, 3),
				dueDate: ts(2026, 3, 5),
				duration: 2,
				completedPercent: 100,
				sortOrder: 1
			},
			{
				title: 'Thiết kế wireframe UI (Figma)',
				description: 'Wireframe các màn hình chính: Dashboard, Kanban board, Task detail, Team management',
				status: TaskStatus.Done,
				type: TaskType.Research,
				priority: TaskPriority.Medium,
				startDate: ts(2026, 3, 4),
				dueDate: ts(2026, 3, 8),
				duration: 4,
				completedPercent: 100,
				sortOrder: 2
			},
			{
				title: 'Setup CI/CD pipeline (Docker + GitHub Actions)',
				description: 'Viết Dockerfile, docker-compose, cấu hình GitHub Actions cho auto deploy',
				status: TaskStatus.Done,
				type: TaskType.Deployment,
				priority: TaskPriority.Medium,
				startDate: ts(2026, 3, 8),
				dueDate: ts(2026, 3, 11),
				duration: 3,
				completedPercent: 100,
				sortOrder: 3
			},
			{
				title: 'Viết tài liệu API specification (OpenAPI)',
				description: 'Định nghĩa tất cả endpoints, request/response schema cho team FE',
				status: TaskStatus.Done,
				type: TaskType.Documentation,
				priority: TaskPriority.Low,
				startDate: ts(2026, 3, 11),
				dueDate: ts(2026, 3, 14),
				duration: 3,
				completedPercent: 100,
				sortOrder: 4
			}
		]
	},
	{
		name: 'Sprint 2 - Authentication & User Management',
		description: 'Xây dựng hệ thống đăng nhập, đăng ký, phân quyền, quản lý profile',
		startDate: ts(2026, 3, 15),
		endDate: ts(2026, 3, 28),
		status: ScheduleStatus.COMPLETED,
		color: '#3b82f6',
		sortOrder: 1,
		tasks: [
			{
				title: 'API đăng ký & đăng nhập (JWT + Refresh Token)',
				description: 'Implement register, login, refresh token, logout endpoints với bcrypt + JWT',
				status: TaskStatus.Done,
				type: TaskType.Feature,
				priority: TaskPriority.High,
				startDate: ts(2026, 3, 15),
				dueDate: ts(2026, 3, 18),
				duration: 3,
				completedPercent: 100,
				sortOrder: 0
			},
			{
				title: 'Tích hợp Google OAuth 2.0',
				description: 'Đăng nhập bằng Google, tự động tạo account nếu chưa có, link với account hiện tại',
				status: TaskStatus.Done,
				type: TaskType.Feature,
				priority: TaskPriority.High,
				startDate: ts(2026, 3, 18),
				dueDate: ts(2026, 3, 20),
				duration: 2,
				completedPercent: 100,
				sortOrder: 1
			},
			{
				title: 'Quên mật khẩu & OTP verification',
				description: 'Gửi OTP qua email, verify OTP, reset password flow',
				status: TaskStatus.Done,
				type: TaskType.Feature,
				priority: TaskPriority.Medium,
				startDate: ts(2026, 3, 20),
				dueDate: ts(2026, 3, 23),
				duration: 3,
				completedPercent: 100,
				sortOrder: 2
			},
			{
				title: 'CRUD User profile & avatar upload',
				description: 'Update profile info, upload avatar lên Cloudinary, resize ảnh',
				status: TaskStatus.Done,
				type: TaskType.Feature,
				priority: TaskPriority.Medium,
				startDate: ts(2026, 3, 23),
				dueDate: ts(2026, 3, 26),
				duration: 3,
				completedPercent: 100,
				sortOrder: 3
			},
			{
				title: 'Middleware phân quyền (RBAC)',
				description: 'Implement role-based access control: Admin, Manager, Member, Viewer',
				status: TaskStatus.Done,
				type: TaskType.Feature,
				priority: TaskPriority.High,
				startDate: ts(2026, 3, 26),
				dueDate: ts(2026, 3, 28),
				duration: 2,
				completedPercent: 100,
				sortOrder: 4
			}
		]
	},
	{
		name: 'Sprint 3 - Project & Task Core',
		description: 'Module quản lý dự án, task CRUD, Kanban board, gán task cho thành viên',
		startDate: ts(2026, 3, 29),
		endDate: ts(2026, 4, 11),
		status: ScheduleStatus.ACTIVE,
		color: '#8b5cf6',
		sortOrder: 2,
		tasks: [
			{
				title: 'CRUD Project (tạo, sửa, xóa, danh sách)',
				description: 'API tạo project, update settings, soft delete, list with pagination & filters',
				status: TaskStatus.Done,
				type: TaskType.Feature,
				priority: TaskPriority.High,
				startDate: ts(2026, 3, 29),
				dueDate: ts(2026, 4, 1),
				duration: 3,
				completedPercent: 100,
				sortOrder: 0
			},
			{
				title: 'CRUD Task với Kanban board API',
				description: 'Task CRUD, drag & drop giữa các cột status, update position & status',
				status: TaskStatus.Done,
				type: TaskType.Feature,
				priority: TaskPriority.High,
				startDate: ts(2026, 4, 1),
				dueDate: ts(2026, 4, 4),
				duration: 3,
				completedPercent: 100,
				sortOrder: 1
			},
			{
				title: 'Task assignment & notification',
				description: 'Gán task cho member, gửi email notification khi được assign hoặc task thay đổi status',
				status: TaskStatus.Processing,
				type: TaskType.Feature,
				priority: TaskPriority.High,
				startDate: ts(2026, 4, 4),
				dueDate: ts(2026, 4, 7),
				duration: 3,
				completedPercent: 60,
				sortOrder: 2
			},
			{
				title: 'Task filters, search & sorting',
				description: 'Filter theo status, priority, assignee, type. Full-text search title/description',
				status: TaskStatus.Pending,
				type: TaskType.Feature,
				priority: TaskPriority.Medium,
				startDate: ts(2026, 4, 7),
				dueDate: ts(2026, 4, 9),
				duration: 2,
				completedPercent: 0,
				sortOrder: 3
			},
			{
				title: 'Task file attachments (Cloudinary)',
				description: 'Upload file đính kèm cho task, preview ảnh, download file',
				status: TaskStatus.Pending,
				type: TaskType.Feature,
				priority: TaskPriority.Low,
				startDate: ts(2026, 4, 9),
				dueDate: ts(2026, 4, 11),
				duration: 2,
				completedPercent: 0,
				sortOrder: 4
			}
		]
	},
	{
		name: 'Sprint 4 - Team & Dashboard',
		description: 'Quản lý team, mời thành viên, dashboard thống kê, biểu đồ tiến độ',
		startDate: ts(2026, 4, 12),
		endDate: ts(2026, 4, 25),
		status: ScheduleStatus.PLANNED,
		color: '#f59e0b',
		sortOrder: 3,
		tasks: [
			{
				title: 'CRUD Team & invite member via email',
				description: 'Tạo team, gửi email mời, accept/reject invitation, remove member',
				status: TaskStatus.Pending,
				type: TaskType.Feature,
				priority: TaskPriority.High,
				startDate: ts(2026, 4, 12),
				dueDate: ts(2026, 4, 15),
				duration: 3,
				completedPercent: 0,
				sortOrder: 0
			},
			{
				title: 'Team role management (Admin, Member, Viewer)',
				description: 'Phân quyền trong team, chỉ admin mới invite/remove, member tạo task',
				status: TaskStatus.Pending,
				type: TaskType.Feature,
				priority: TaskPriority.High,
				startDate: ts(2026, 4, 15),
				dueDate: ts(2026, 4, 17),
				duration: 2,
				completedPercent: 0,
				sortOrder: 1
			},
			{
				title: 'Dashboard tổng quan dự án',
				description: 'Thống kê: tổng task, task theo status, task overdue, tiến độ tổng thể',
				status: TaskStatus.Pending,
				type: TaskType.Feature,
				priority: TaskPriority.Medium,
				startDate: ts(2026, 4, 17),
				dueDate: ts(2026, 4, 20),
				duration: 3,
				completedPercent: 0,
				sortOrder: 2
			},
			{
				title: 'Biểu đồ workload & burndown chart',
				description: 'API trả data cho biểu đồ phân bổ công việc theo member, burndown chart theo sprint',
				status: TaskStatus.Pending,
				type: TaskType.Feature,
				priority: TaskPriority.Medium,
				startDate: ts(2026, 4, 20),
				dueDate: ts(2026, 4, 23),
				duration: 3,
				completedPercent: 0,
				sortOrder: 3
			},
			{
				title: 'Activity log & audit trail',
				description: 'Ghi lại mọi thao tác: ai tạo/sửa/xóa task, thay đổi status, assign member',
				status: TaskStatus.Pending,
				type: TaskType.Feature,
				priority: TaskPriority.Low,
				startDate: ts(2026, 4, 23),
				dueDate: ts(2026, 4, 25),
				duration: 2,
				completedPercent: 0,
				sortOrder: 4
			}
		]
	},
	{
		name: 'Sprint 5 - AI Assistant & Billing',
		description: 'Tích hợp AI gợi ý task, hệ thống billing subscription, thanh toán',
		startDate: ts(2026, 4, 26),
		endDate: ts(2026, 5, 9),
		status: ScheduleStatus.PLANNED,
		color: '#ef4444',
		sortOrder: 4,
		tasks: [
			{
				title: 'AI task suggestion & auto-assignment',
				description: 'Dùng OpenAI API gợi ý breakdown task lớn thành subtask, tự động gán member phù hợp',
				status: TaskStatus.Pending,
				type: TaskType.Feature,
				priority: TaskPriority.High,
				startDate: ts(2026, 4, 26),
				dueDate: ts(2026, 4, 29),
				duration: 3,
				completedPercent: 0,
				sortOrder: 0
			},
			{
				title: 'AI code review & feedback scoring',
				description: 'AI đánh giá chất lượng task, cho điểm, feedback tự động cho team member',
				status: TaskStatus.Pending,
				type: TaskType.Feature,
				priority: TaskPriority.Medium,
				startDate: ts(2026, 4, 29),
				dueDate: ts(2026, 5, 2),
				duration: 3,
				completedPercent: 0,
				sortOrder: 1
			},
			{
				title: 'Hệ thống subscription plans (Free/Pro/Enterprise)',
				description: 'API tạo plan, check quota, enforce limits theo plan, upgrade/downgrade flow',
				status: TaskStatus.Pending,
				type: TaskType.Feature,
				priority: TaskPriority.High,
				startDate: ts(2026, 5, 2),
				dueDate: ts(2026, 5, 5),
				duration: 3,
				completedPercent: 0,
				sortOrder: 2
			},
			{
				title: 'Tích hợp thanh toán (VNPay/PayOS)',
				description: 'Payment gateway integration, webhook xử lý callback, lưu payment history',
				status: TaskStatus.Pending,
				type: TaskType.Feature,
				priority: TaskPriority.High,
				startDate: ts(2026, 5, 5),
				dueDate: ts(2026, 5, 7),
				duration: 2,
				completedPercent: 0,
				sortOrder: 3
			},
			{
				title: 'Invoice generation & email receipt',
				description: 'Tạo hóa đơn PDF, gửi email xác nhận thanh toán, lịch sử giao dịch',
				status: TaskStatus.Pending,
				type: TaskType.Documentation,
				priority: TaskPriority.Medium,
				startDate: ts(2026, 5, 7),
				dueDate: ts(2026, 5, 9),
				duration: 2,
				completedPercent: 0,
				sortOrder: 4
			}
		]
	}
]

async function seedGantt() {
	try {
		console.log('🔌 Đang kết nối database...')
		await AppDataSource.initialize()
		console.log('✅ Đã kết nối database thành công')

		const scheduleRepo = AppDataSource.getRepository(Schedule)
		const taskRepo = AppDataSource.getRepository(Task)

		console.log(`\n📝 Đang seed ${schedules.length} schedules cho project #${PROJECT_ID}...\n`)

		for (const scheduleData of schedules) {
			const { tasks, ...scheduleFields } = scheduleData

			const schedule = scheduleRepo.create({
				...scheduleFields,
				projectId: PROJECT_ID
			})
			const savedSchedule = await scheduleRepo.save(schedule)
			console.log(`   ✅ Schedule: "${savedSchedule.name}" (id: ${savedSchedule.id})`)

			for (const taskData of tasks) {
				const task = taskRepo.create({
					...taskData,
					projectId: PROJECT_ID,
					scheduleId: savedSchedule.id
				})
				const savedTask = await taskRepo.save(task)
				console.log(`      📌 Task: "${savedTask.title}" [${savedTask.status}]`)
			}
		}

		// Summary
		const totalSchedules = await scheduleRepo.count({ where: { projectId: PROJECT_ID } })
		const totalTasks = await taskRepo.count({ where: { projectId: PROJECT_ID, scheduleId: undefined } as any })

		console.log(`\n📊 Kết quả seed:`)
		console.log(`   - Schedules: ${totalSchedules}`)
		console.log(`   - Tasks (in schedules): ${schedules.reduce((sum, s) => sum + s.tasks.length, 0)}`)

		await AppDataSource.destroy()
		console.log('\n✅ Hoàn tất seed gantt data!')
		process.exit(0)
	} catch (error) {
		console.error('❌ Lỗi khi seed gantt:', error)
		process.exit(1)
	}
}

seedGantt()
