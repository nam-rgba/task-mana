import { Server as HttpServer } from 'http'
import { WebSocket, WebSocketServer } from 'ws'

type WsPayload = {
	event: string
	data: any
}

class NotificationWsService {
	private wss?: WebSocketServer
	private userSockets = new Map<number, Set<WebSocket>>()

	init(server: HttpServer) {
		if (this.wss) {
			return this.wss
		}

		this.wss = new WebSocketServer({
			server,
			path: '/ws/notifications'
		})

		this.wss.on('connection', (socket, request) => {
			const userId = this.resolveUserId(request.url || '', request.headers['x-user-id'])
			if (!userId) {
				socket.close(1008, 'Missing userId')
				return
			}

			this.registerSocket(userId, socket)
			this.sendSocket(socket, {
				event: 'notifications:connected',
				data: { userId }
			})

			socket.on('close', () => {
				this.unregisterSocket(userId, socket)
			})
		})

		return this.wss
	}

	sendToUser(userId: number, payload: WsPayload) {
		const sockets = this.userSockets.get(userId)
		if (!sockets?.size) return false

		for (const socket of sockets) {
			if (socket.readyState === WebSocket.OPEN) {
				this.sendSocket(socket, payload)
			}
		}

		return true
	}

	private resolveUserId(url: string, headerUserId?: string | string[]) {
		const urlObj = new URL(url, 'http://localhost')
		const fromQuery = Number(urlObj.searchParams.get('userId'))
		if (fromQuery > 0) return fromQuery

		const rawHeader = Array.isArray(headerUserId) ? headerUserId[0] : headerUserId
		const fromHeader = Number(rawHeader)
		if (fromHeader > 0) return fromHeader

		return null
	}

	private registerSocket(userId: number, socket: WebSocket) {
		const current = this.userSockets.get(userId) || new Set<WebSocket>()
		current.add(socket)
		this.userSockets.set(userId, current)
	}

	private unregisterSocket(userId: number, socket: WebSocket) {
		const current = this.userSockets.get(userId)
		if (!current) return

		current.delete(socket)
		if (current.size === 0) {
			this.userSockets.delete(userId)
		}
	}

	private sendSocket(socket: WebSocket, payload: WsPayload) {
		socket.send(JSON.stringify(payload))
	}
}

export const notificationWsService = new NotificationWsService()
