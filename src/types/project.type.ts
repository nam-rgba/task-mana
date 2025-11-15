// shared/types/project.interface.ts
import { ProjectType, ProjectStatus, ProjectVisibility, DefaultAssigneeType } from '~/model/enums/project.enum.js'
import { Team } from './team.type.js'
import { User } from './user.type.js'

export interface ProjectSettings {
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

export interface ProjectDto {
	id: number
	key: string
	name: string
	description?: string

	// Quan hệ
	teamId: string
	leadId?: string

	type: ProjectType
	status: ProjectStatus
	category?: string
	avatarUrl?: string
	color?: string
	startDate?: string
	endDate?: string
	visibility: ProjectVisibility

	permissionSchemeId?: string
	workflowSchemeId?: string
	issueTypeSchemeId?: string

	defaultAssigneeType: DefaultAssigneeType
	defaultAssigneeId?: string
	lastIssueNumber: number

	settings?: ProjectSettings

	// Optional: embedded liên kết
	team?: Team

	lead?: User

	createdAt: string
	updatedAt: string
}
