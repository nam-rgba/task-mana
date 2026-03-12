import { In } from 'typeorm'
import { AppDataSource } from '~/db/data-source.js'
import { Task } from '~/model/task.entity.js'
import { CreateScheduleDto, UpdateScheduleDto } from '~/model/dto/gantt.dto.js'
import { getScheduleRepository } from '~/repository/schedule.repository.js'
import { getProjectRepository } from '~/repository/project.repository.js'
import { scheduleStatusService } from './schedule-status.service.js'
import { TaskStatus } from '~/types/task.type.js'
import { BadRequestError, NotFoundError } from '~/utils/error.reponse.js'

class ScheduleService {
	private scheduleRepo = getScheduleRepository()
	private projectRepo = getProjectRepository()

	async getByProject(projectId: number) {
		const project = await this.projectRepo.findOneById(projectId)
		if (!project) throw new NotFoundError(`Project with id ${projectId} not found`)
		return await this.scheduleRepo.findByProject(projectId)
	}

	async getOne(projectId: number, id: number) {
		const schedule = await this.scheduleRepo.findOneWithTasks(id)
		if (!schedule || schedule.projectId !== projectId) {
			throw new NotFoundError(`Schedule with id ${id} not found in project ${projectId}`)
		}
		return schedule
	}

	async create(projectId: number, data: CreateScheduleDto) {
		const project = await this.projectRepo.findOneById(projectId)
		if (!project) throw new NotFoundError(`Project with id ${projectId} not found`)

		if (data.startDate > data.endDate) {
			throw new BadRequestError('startDate must be less than or equal to endDate')
		}

		const maxSort = await this.scheduleRepo.getMaxSortOrder(projectId)

		return await this.scheduleRepo.create({
			...data,
			projectId,
			sortOrder: maxSort + 1
		})
	}

	async update(projectId: number, id: number, data: UpdateScheduleDto) {
		const schedule = await this.scheduleRepo.findOneById(id)
		if (!schedule || schedule.projectId !== projectId) {
			throw new NotFoundError(`Schedule with id ${id} not found in project ${projectId}`)
		}

		const startDate = data.startDate ?? schedule.startDate
		const endDate = data.endDate ?? schedule.endDate
		if (startDate > endDate) {
			throw new BadRequestError('startDate must be less than or equal to endDate')
		}

		return await this.scheduleRepo.update(id, data)
	}

	async delete(projectId: number, id: number) {
		const schedule = await this.scheduleRepo.findOneById(id)
		if (!schedule || schedule.projectId !== projectId) {
			throw new NotFoundError(`Schedule with id ${id} not found in project ${projectId}`)
		}
		return await this.scheduleRepo.remove(id)
	}

	async reorder(projectId: number, orders: { id: number; sortOrder: number }[]) {
		await this.scheduleRepo.bulkUpdateSortOrder(orders)
	}

	async bulkAssignTasks(projectId: number, scheduleId: number, taskIds: number[]) {
		const schedule = await this.scheduleRepo.findOneById(scheduleId)
		if (!schedule || schedule.projectId !== projectId) {
			throw new NotFoundError(`Schedule with id ${scheduleId} not found in project ${projectId}`)
		}

		const taskRepo = AppDataSource.getRepository(Task)
		const tasks = await taskRepo.find({
			where: { id: In(taskIds), projectId }
		})

		if (tasks.length !== taskIds.length) {
			throw new BadRequestError('Some tasks not found or do not belong to this project')
		}

		await taskRepo.update({ id: In(taskIds) }, { scheduleId })

		if (tasks.some((task) => task.status !== TaskStatus.Pending)) {
			await scheduleStatusService.activateScheduleWhenTaskStarted(scheduleId)
		}

		return tasks.map((t) => ({ id: t.id, scheduleId }))
	}

	async reorderTasks(projectId: number, scheduleId: number, orders: { id: number; sortOrder: number }[]) {
		const schedule = await this.scheduleRepo.findOneById(scheduleId)
		if (!schedule || schedule.projectId !== projectId) {
			throw new NotFoundError(`Schedule with id ${scheduleId} not found in project ${projectId}`)
		}

		const taskRepo = AppDataSource.getRepository(Task)
		await Promise.all(orders.map((o) => taskRepo.update(o.id, { sortOrder: o.sortOrder })))
	}
}

export const scheduleService = new ScheduleService()
