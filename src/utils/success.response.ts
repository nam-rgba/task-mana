import code from './res/status-code.js'
import reason from './res/reason-pharse.js'

export interface ISuccessResponse {
	message?: string
	metadata: any
	statusCode?: number
}

export class SuccessResponse {
	public message?: string
	public metadata: any
	public statusCode?: number

	constructor({ message, statusCode, metadata }: ISuccessResponse) {
		this.message = message
		this.metadata = metadata
		this.statusCode = statusCode
	}

	send(res: any) {
		return res.status(this.statusCode).json({
			message: this.message,
			code: this.statusCode,
			metadata: this.metadata
		})
	}
}
export class CreatedResponse extends SuccessResponse {
	constructor(message: string = reason.CREATED, statusCode: number = code.CREATED, metadata: any = {}) {
		super({ metadata, message, statusCode })
	}
}

export class OKResponse extends SuccessResponse {
	constructor(message: string = reason.OK, statusCode: number = code.OK, metadata: any = {}) {
		super({ metadata, message, statusCode })
	}
}
