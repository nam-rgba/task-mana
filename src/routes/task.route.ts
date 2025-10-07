// src/routes/task.routes.ts
import { Router } from 'express'
import { TaskController } from '~/controllers/task.controller.js'

const router = Router()
const ctrl = new TaskController()

router.get('/', (req, res) => ctrl.getTasks(req, res))
router.get('/:id', (req, res) => ctrl.getTask(req, res))
router.post('/', (req, res) => ctrl.createTask(req, res))
router.put('/:id', (req, res) => ctrl.updateTask(req, res))
router.delete('/:id', (req, res) => ctrl.deleteTask(req, res))

export { router as taskRouter }
