import fs from 'fs'
import path from 'path'

const LOG_DIR = path.resolve('logs')
const LOG_FILE = path.join(LOG_DIR, 'ai-requests.log')
const MAX_BODY_LENGTH = 5000

if (!fs.existsSync(LOG_DIR)) {
	fs.mkdirSync(LOG_DIR, { recursive: true })
}

function truncate(data: any): string {
	const str = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
	if (str.length > MAX_BODY_LENGTH) {
		return str.slice(0, MAX_BODY_LENGTH) + `\n... [truncated, total ${str.length} chars]`
	}
	return str
}

function pickApiKeyHeader(headers?: Record<string, any>) {
	if (!headers) return undefined
	const rawValue = headers['x-api-key'] ?? headers.x_api_key ?? headers['x-groq-api-key']
	const provider = headers['x-provider'] || ''
	const modelname = headers['x-model-name'] || ''
	if (!rawValue) return undefined
	return {
		'x-api-key': rawValue,
		'x-provider': provider,
		'x-model-name': modelname
	}
}

function formatLog(entry: {
	timestamp: string
	direction: 'REQUEST' | 'RESPONSE' | 'ERROR'
	method: string
	url: string
	duration?: number
	status?: number
	headers?: Record<string, any>
	body?: any
	error?: string
}): string {
	const apiKeyHeader = pickApiKeyHeader(entry.headers)
	const lines = [
		`\n${'═'.repeat(80)}`,
		`[${entry.timestamp}] ${entry.direction} ${entry.method} ${entry.url}`,
		entry.status ? `Status: ${entry.status}` : '',
		entry.duration ? `Duration: ${entry.duration}ms` : '',
		apiKeyHeader ? `Headers:\n${truncate(apiKeyHeader)}` : '',
		entry.body !== undefined ? `Body:\n${truncate(entry.body)}` : '',
		entry.error ? `Error: ${entry.error}` : '',
		'═'.repeat(80)
	]
	return lines.filter(Boolean).join('\n')
}

class AiLogger {
	private write(text: string) {
		// File (append)
		fs.appendFile(LOG_FILE, text + '\n', () => {})
	}

	logRequest(method: string, url: string, body?: any, headers?: Record<string, any>) {
		const timestamp = new Date().toISOString()
		this.write(
			formatLog({
				timestamp,
				direction: 'REQUEST',
				method,
				url,
				headers,
				body
			})
		)
		return { timestamp, startTime: Date.now() }
	}

	logResponse(method: string, url: string, status: number, data: any, startTime: number) {
		this.write(
			formatLog({
				timestamp: new Date().toISOString(),
				direction: 'RESPONSE',
				method,
				url,
				status,
				duration: Date.now() - startTime,
				body: data
			})
		)
	}

	logError(method: string, url: string, error: any, startTime: number) {
		const status = error.response?.status
		const errorBody = error.response?.data
		this.write(
			formatLog({
				timestamp: new Date().toISOString(),
				direction: 'ERROR',
				method,
				url,
				status,
				duration: Date.now() - startTime,
				body: errorBody,
				error: `${error.code || error.message || error}`
			})
		)
	}
}

export const aiLogger = new AiLogger()
