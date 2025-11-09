import 'reflect-metadata'
import dotenv from 'dotenv'
dotenv.config()
import { DataSource } from 'typeorm'
import { User } from '../model/User.js'
import { Token } from '../model/Token.js'
import { Task } from '~/model/Task.js'
import { Team } from '~/model/Team.entity.js'
import { TeamMember } from '~/model/teamMember.entity.js'
import { Project } from '~/model/Project.entity.js'

export const AppDataSource = new DataSource({
	type: 'postgres',
	url: process.env.DATABASE_URL,
	synchronize: true,
	logging: false,
	entities: [User, Token, Task, Team, TeamMember, Project]
})
