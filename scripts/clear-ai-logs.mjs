import fs from 'fs'
import path from 'path'

const logDir = path.resolve('logs')
const logFile = path.join(logDir, 'ai-requests.log')

fs.mkdirSync(logDir, { recursive: true })
fs.writeFileSync(logFile, '')

console.log(`Cleared AI log file: ${logFile}`)
