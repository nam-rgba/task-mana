import express from 'express'
import AiDataController from '~/controllers/aidata.controller.js'
import AsyncHandler from '~/utils/async-handler.js'

const aiRouter = express.Router()

aiRouter.get('/tasks', AsyncHandler(AiDataController.getAllTask))
aiRouter.get('/members', AsyncHandler(AiDataController.getAllMembers))
aiRouter.get('/projects', AsyncHandler(AiDataController.getAllProject))
aiRouter.get('/users', AsyncHandler(AiDataController.getAllUsers))

export { aiRouter }
