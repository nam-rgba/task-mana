import code from './res/status-code.js'
import reason from './res/reason-pharse.js'

class ErrorResponse extends Error {
	constructor(
		message: string,
		public statusCode: number
	) {
		super(message)
		this.statusCode = statusCode
	}
}

class BadRequestError extends ErrorResponse {
	constructor(message = reason.BAD_REQUEST) {
		super(message, code.BAD_REQUEST)
	}
}

class UnauthorizedError extends ErrorResponse {
	constructor(message = reason.UNAUTHORIZED) {
		super(message, code.UNAUTHORIZED)
	}
}

class ForbiddenError extends ErrorResponse {
	constructor(message = reason.FORBIDDEN) {
		super(message, code.FORBIDDEN)
	}
}

class NotFoundError extends ErrorResponse {
	constructor(message = reason.NOT_FOUND) {
		super(message, code.NOT_FOUND)
	}
}

class ConflictError extends ErrorResponse {
	constructor(message = reason.CONFLICT) {
		super(message, code.CONFLICT)
	}
}

export {
	ErrorResponse as ErrowResponse,
	BadRequestError,
	UnauthorizedError,
	ForbiddenError,
	NotFoundError,
	ConflictError
}
