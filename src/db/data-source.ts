import 'reflect-metadata'
import dotenv from 'dotenv'
dotenv.config()
import { DataSource } from 'typeorm'
import { User } from '../model/user.entity.js'
import { Token } from '../model/token.entity.js'
import { Task } from '~/model/task.entity.js'
import { Team } from '~/model/team.entity.js'
import { TeamMember } from '~/model/teamMember.entity.js'
import { Project } from '~/model/project.entity.js'
import { AiFeedback } from '~/model/ai-feedback.entity.js'
import { Plan } from '~/model/plan.entity.js'
import { Subscription } from '~/model/subscription.entity.js'
import { Order } from '~/model/order.entity.js'
import { PaymentHistory } from '~/model/payment-history.entity.js'
import { otp } from '~/model/otp.entity.js'
import { Schedule } from '~/model/schedule.entity.js'
import { TaskDependency } from '~/model/task-dependency.entity.js'
import { Milestone } from '~/model/milestone.entity.js'
import { Document } from '~/model/document.entity.js'
import { Notification } from '~/model/notification.entity.js'
import { EmailLog } from '~/model/email-log.entity.js'
import { ApiKey } from '~/model/api-key.entity.js'
import { Usage } from '~/model/usage.entity.js'
import { TaskComment } from '~/model/task-comment.entity.js'
import { Skill } from '~/model/skill.entity.js'
import { UserSkill } from '~/model/user-skill.entity.js'

export const AppDataSource = new DataSource({
	type: 'postgres',
	url: process.env.DATABASE_URL,
	synchronize: true,
	logging: false,
	entities: [
		User,
		Token,
		Task,
		Team,
		TeamMember,
		Project,
		AiFeedback,
		Plan,
		Subscription,
		Order,
		PaymentHistory,
		otp,
		Schedule,
		TaskDependency,
		Milestone,
		Document,
		Notification,
		EmailLog,
		ApiKey,
		Usage,
		TaskComment,
		Skill,
		UserSkill
	]
})
