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

export const AppDataSource = new DataSource({
	type: 'postgres',
	url: process.env.DATABASE_URL,
	synchronize: true,
	logging: false,
	entities: [User, Token, Task, Team, TeamMember, Project]
})
