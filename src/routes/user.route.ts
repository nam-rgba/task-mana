import { Router } from 'express'
import { UserController } from '~/controllers/user.controller.js'
import AsyncHandler from '../utils/async-handler.js'

const router = Router()
const ctrl = new UserController()

router.get('/', AsyncHandler(ctrl.getAllUsers))
router.get('/profile', AsyncHandler(ctrl.getProfile))
router.put('/profile', AsyncHandler(ctrl.updateProfile))

export { router as userRouter }
