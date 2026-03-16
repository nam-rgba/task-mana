import fs from 'fs'
import path from 'path'

const LOG_DIR = path.resolve('logs')
const LOG_FILE = path.join(LOG_DIR, 'ai-requests.log')
const MAX_BODY_LENGTH = 5000
const ENABLE_CONSOLE_LOG = process.env.AI_LOG_CONSOLE !== 'false'
const COLOR_ENABLED = Boolean(process.stdout.isTTY) && process.env.NO_COLOR !== '1'

const ANSI = {
	reset: '\x1b[0m',
	bold: '\x1b[1m',
	dim: '\x1b[2m',
	cyan: '\x1b[36m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	red: '\x1b[31m',
	magenta: '\x1b[35m',
	gray: '\x1b[90m'
} as const

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

function colorize(text: string, color?: string) {
	if (!color || !COLOR_ENABLED) return text
	return `${color}${text}${ANSI.reset}`
}

function addPrefixToLines(text: string, prefix = '│  ') {
	return text
		.split('\n')
		.map((line) => `${prefix}${line}`)
		.join('\n')
}

function formatField(label: string, value: string, colored = false) {
	const paddedLabel = `${label}:`.padEnd(10, ' ')
	return `│ ${colored ? colorize(paddedLabel, ANSI.dim) : paddedLabel} ${value}`
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

function formatLog(
	entry: {
		timestamp: string
		direction: 'REQUEST' | 'RESPONSE' | 'ERROR'
		method: string
		url: string
		duration?: number
		status?: number
		headers?: Record<string, any>
		body?: any
		error?: string
	},
	colored = false
): string {
	const apiKeyHeader = pickApiKeyHeader(entry.headers)
	const directionColor =
		entry.direction === 'REQUEST' ? ANSI.cyan : entry.direction === 'RESPONSE' ? ANSI.green : ANSI.red

	const title = `${entry.direction} ${entry.method} ${entry.url}`
	const lines = [
		colored ? '' : `\n${'═'.repeat(100)}`,
		`┌ ${colored ? colorize(title, `${ANSI.bold}${directionColor}`) : title}`,
		formatField('Time', entry.timestamp, colored),
		entry.status !== undefined ? formatField('Status', String(entry.status), colored) : '',
		entry.duration !== undefined ? formatField('Duration', `${entry.duration}ms`, colored) : '',
		apiKeyHeader ? `${formatField('Headers', '', colored)}\n${addPrefixToLines(truncate(apiKeyHeader), '│   ')}` : '',
		entry.body !== undefined
			? `${formatField('Body', '', colored)}\n${addPrefixToLines(truncate(entry.body), '│   ')}`
			: '',
		entry.error ? formatField('Error', colored ? colorize(entry.error, ANSI.red) : entry.error, colored) : '',
		`└ ${colored ? colorize('end', ANSI.gray) : 'end'}`,
		colored ? '' : `${'═'.repeat(100)}`
	]
	return lines.filter(Boolean).join('\n')
}

class AiLogger {
	private write(text: string) {
		// File (append)
		fs.appendFile(LOG_FILE, text + '\n', () => {})
	}

	private writeConsole(text: string) {
		if (!ENABLE_CONSOLE_LOG) return
		// console.log(text)
	}

	logRequest(method: string, url: string, body?: any, headers?: Record<string, any>) {
		const timestamp = new Date().toISOString()
		const entry = {
			timestamp,
			direction: 'REQUEST' as const,
			method,
			url,
			headers,
			body
		}
		this.write(formatLog(entry))
		this.writeConsole(formatLog(entry, true))
		return { timestamp, startTime: Date.now() }
	}

	logResponse(method: string, url: string, status: number, data: any, startTime: number) {
		const entry = {
			timestamp: new Date().toISOString(),
			direction: 'RESPONSE' as const,
			method,
			url,
			status,
			duration: Date.now() - startTime,
			body: data
		}
		this.write(formatLog(entry))
		this.writeConsole(formatLog(entry, true))
	}

	logError(method: string, url: string, error: any, startTime: number) {
		const status = error.response?.status
		const errorBody = error.response?.data
		const entry = {
			timestamp: new Date().toISOString(),
			direction: 'ERROR' as const,
			method,
			url,
			status,
			duration: Date.now() - startTime,
			body: errorBody,
			error: `${error.code || error.message || error}`
		}
		this.write(formatLog(entry))
		this.writeConsole(formatLog(entry, true))
	}
}

export const aiLogger = new AiLogger()
