export enum ScheduleStatus {
	PLANNED = 'PLANNED',
	ACTIVE = 'ACTIVE',
	COMPLETED = 'COMPLETED',
	ON_HOLD = 'ON_HOLD'
}

export enum DependencyType {
	FS = 'FS', // Finish-to-Start
	FF = 'FF', // Finish-to-Finish
	SS = 'SS', // Start-to-Start
	SF = 'SF' // Start-to-Finish
}

export enum MilestoneStatus {
	PENDING = 'PENDING',
	IN_PROGRESS = 'IN_PROGRESS',
	COMPLETED = 'COMPLETED'
}
