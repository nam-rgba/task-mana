export enum ProjectType {
	SOFTWARE = 'SOFTWARE',
	BUSINESS = 'BUSINESS',
	MARKETING = 'MARKETING',
	SERVICE_DESK = 'SERVICE_DESK'
}

export enum ProjectStatus {
	ACTIVE = 'ACTIVE',
	ARCHIVED = 'ARCHIVED',
	PLANNING = 'PLANNING',
	ON_HOLD = 'ON_HOLD',
	COMPLETED = 'COMPLETED'
}

export enum ProjectVisibility {
	PRIVATE = 'PRIVATE', // chỉ team & người được mời
	INTERNAL = 'INTERNAL', // trong org
	PUBLIC = 'PUBLIC' // nếu sau này cần public
}

export enum DefaultAssigneeType {
	PROJECT_LEAD = 'PROJECT_LEAD',
	UNASSIGNED = 'UNASSIGNED',
	COMPONENT_LEAD = 'COMPONENT_LEAD'
}
