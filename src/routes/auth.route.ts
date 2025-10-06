import express from 'express'
import AsyncHandler from '../utils/async-handler.js'
import { authenticate } from '~/utils/auth/auth.js'
import AuthController from '../controllers/auth.controller.js'

const router = express.Router()

// register
router.post('/register', AsyncHandler(AuthController.register))

// login
router.post('/login', AsyncHandler(AuthController.login))

export { router }
