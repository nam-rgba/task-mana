import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm'
import { AppBaseEntity } from './base.entity.js'
import { Team } from './team.entity.js'
import { User } from './user.entity.js'
import { ProjectType, ProjectStatus, ProjectVisibility, DefaultAssigneeType } from './enums/project.enum.js'

@Entity('projects')
export class Project extends AppBaseEntity {
	// Key kiểu Jira: "CRM", "OPS", "MKT2025"
	@Index({ unique: true })
	@Column({ type: 'varchar', length: 20 })
	key: string

	@Column({ type: 'varchar', length: 200 })
	name: string

	@Column({ type: 'text', nullable: true })
	description?: string

	// Project thuộc 1 team duy nhất
	@ManyToOne(() => Team, (team) => team.projects, {
		nullable: false,
		onDelete: 'RESTRICT' // hoặc CASCADE tùy triết lý
	})
	@JoinColumn({ name: 'teamId' })
	team: Team

	@Column({ type: 'uuid' })
	teamId: string

	// Project Lead
	@ManyToOne(() => User, (user) => user.leadingProjects, {
		nullable: true,
		onDelete: 'SET NULL'
	})
	@JoinColumn({ name: 'leadId' })
	lead?: User

	@Column({ type: 'uuid', nullable: true })
	leadId?: string

	// Loại project
	@Column({
		type: 'enum',
		enum: ProjectType,
		default: ProjectType.SOFTWARE
	})
	type: ProjectType

	// Trạng thái vòng đời
	@Column({
		type: 'enum',
		enum: ProjectStatus,
		default: ProjectStatus.ACTIVE
	})
	status: ProjectStatus

	// Nhóm / Category (VD: "Platform", "Growth", "Internal", ...)
	@Column({ type: 'varchar', length: 100, nullable: true })
	category?: string

	// UI / Branding
	@Column({ type: 'varchar', length: 255, nullable: true })
	avatarUrl?: string

	@Column({ type: 'varchar', length: 7, nullable: true })
	color?: string // #RRGGBB

	// Ngày
	@Column({ type: 'date', nullable: true })
	startDate?: string

	@Column({ type: 'date', nullable: true })
	endDate?: string

	// Visibility & Permission
	@Column({
		type: 'enum',
		enum: ProjectVisibility,
		default: ProjectVisibility.PRIVATE
	})
	visibility: ProjectVisibility

	@Column({ type: 'uuid', nullable: true })
	permissionSchemeId?: string // mapping sang bảng permission_schemes

	@Column({ type: 'uuid', nullable: true })
	workflowSchemeId?: string // mapping sang workflow_schemes

	@Column({ type: 'uuid', nullable: true })
	issueTypeSchemeId?: string // mapping issue types

	// Default assignee rule
	@Column({
		type: 'enum',
		enum: DefaultAssigneeType,
		default: DefaultAssigneeType.PROJECT_LEAD
	})
	defaultAssigneeType: DefaultAssigneeType

	@Column({ type: 'uuid', nullable: true })
	defaultAssigneeId?: string // nếu kiểu COMPONENT_LEAD / custom

	// Issue key chạy auto: PROJECT-1, PROJECT-2
	@Column({ type: 'int', default: 0 })
	lastIssueNumber: number

	// Custom config thêm (mở rộng kiểu Jira)
	@Column({ type: 'jsonb', nullable: true })
	settings?: {
		estimation?: {
			enableStoryPoints?: boolean
			enableTimeTracking?: boolean
			defaultEstimateUnit?: 'h' | 'd' | 'sp'
		}
		sla?: {
			enabled?: boolean
			defaultResponseTimeHours?: number
		}
		notifications?: {
			emailOnIssueCreated?: boolean
			emailOnIssueAssigned?: boolean
			slackWebhookUrl?: string
		}
		integrations?: {
			githubRepo?: string
			gitlabProjectId?: string
			linearId?: string
		}
	}
}
