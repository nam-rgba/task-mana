import express from 'express'
import AsyncHandler from '../utils/async-handler.js'
import AuthController from '../controllers/auth.controller.js'

const router = express.Router()

// register
router.post('/register', AsyncHandler(AuthController.register))

// login
router.post('/login', AsyncHandler(AuthController.login))

// verify email
router.get('/verify-email', AsyncHandler(AuthController.verifyEmail))

// Google OAuth
router.get('/google', AsyncHandler(AuthController.googleAuth))
router.get('/google/callback', AsyncHandler(AuthController.googleCallback))

export { router }
