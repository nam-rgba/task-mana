import code from './res/status-code.js'
import reason from './res/reason-pharse.js'

class ErrowResponse extends Error {
	constructor(
		message: string,
		public statusCode: number
	) {
		super(message)
		this.statusCode = statusCode
	}
}

class BadRequestError extends ErrowResponse {
	constructor(message = reason.BAD_REQUEST) {
		super(message, code.BAD_REQUEST)
	}
}

class UnauthorizedError extends ErrowResponse {
	constructor(message = reason.UNAUTHORIZED) {
		super(message, code.UNAUTHORIZED)
	}
}

class ForbiddenError extends ErrowResponse {
	constructor(message = reason.FORBIDDEN) {
		super(message, code.FORBIDDEN)
	}
}

class NotFoundError extends ErrowResponse {
	constructor(message = reason.NOT_FOUND) {
		super(message, code.NOT_FOUND)
	}
}

class ConflictError extends ErrowResponse {
	constructor(message = reason.CONFLICT) {
		super(message, code.CONFLICT)
	}
}

export { ErrowResponse, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError }
