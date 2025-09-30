import code from './res/status-code.js'
import reason from './res/reason-pharse.js'

export class SuccessResponse {
	constructor(
		public message: string = reason.OK,
		public statusCode: number = code.OK
	) {}
}
export class CreatedResponse {
	constructor(
		public message: string = reason.CREATED,
		public statusCode: number = code.CREATED
	) {}
}
export class NoContentResponse {
	constructor(
		public message: string = reason.NO_CONTENT,
		public statusCode: number = code.NO_CONTENT
	) {}
}
