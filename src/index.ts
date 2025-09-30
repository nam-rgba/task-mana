import express from 'express'
import { connectDb } from './db/db.js'
const app = express()

import morgan from 'morgan'

app.use(morgan('dev'))

// connect db
connectDb()

app.listen(3000, () => console.log('server running'))
