import { Not } from 'typeorm'
import { AppDataSource } from '~/db/data-source.js'
import { ScheduleStatus } from '~/model/enums/gantt.enum.js'
import { Schedule } from '~/model/schedule.entity.js'
import { Task } from '~/model/task.entity.js'
import { TaskStatus } from '~/types/task.type.js'

class ScheduleStatusService {
	async activateScheduleWhenTaskStarted(scheduleId?: number | null) {
		if (!scheduleId) return

		const scheduleRepo = AppDataSource.getRepository(Schedule)
		const taskRepo = AppDataSource.getRepository(Task)

		const schedule = await scheduleRepo.findOneBy({ id: scheduleId })
		if (!schedule || schedule.status !== ScheduleStatus.PLANNED) {
			return
		}

		const startedTaskCount = await taskRepo.count({
			where: {
				scheduleId,
				status: Not(TaskStatus.Pending)
			}
		})

		if (startedTaskCount === 0) {
			return
		}

		schedule.status = ScheduleStatus.ACTIVE
		await scheduleRepo.save(schedule)
	}
}

export const scheduleStatusService = new ScheduleStatusService()
