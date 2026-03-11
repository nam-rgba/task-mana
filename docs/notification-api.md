# API: Notifications + Email (WebSocket + REST)

## Mục tiêu

Backend hỗ trợ 2 lớp thông báo:

- Realtime qua WebSocket khi user đang online
- Lưu DB để khi user offline, lúc vào lại trang vẫn lấy được lịch sử thông báo qua API

Ngoài ra, mỗi lần gửi email thông báo hệ thống sẽ lưu log vào bảng `email_logs`.

---

## Thành phần backend

### 1. Bảng dữ liệu

#### `notifications`

Lưu toàn bộ thông báo gửi cho user.

Các field chính:

| Field       | Type     | Mô tả                                  |
| ----------- | -------- | -------------------------------------- |
| `id`        | number   | ID thông báo                           |
| `userId`    | number   | User nhận thông báo                    |
| `type`      | string   | Loại thông báo                         |
| `title`     | string   | Tiêu đề                                |
| `content`   | string   | Nội dung đã render từ Handlebars       |
| `isRead`    | boolean  | Đã đọc hay chưa                        |
| `readAt`    | datetime | Thời điểm đọc                          |
| `metadata`  | object   | Metadata mở rộng, ví dụ `taskId`, role |
| `createdAt` | datetime | Thời điểm tạo                          |

#### `email_logs`

Lưu lại lịch sử email đã gửi hoặc gửi thất bại.

Các field chính:

| Field          | Type     | Mô tả                                 |
| -------------- | -------- | ------------------------------------- |
| `id`           | number   | ID log                                |
| `userId`       | number   | User nhận email                       |
| `toEmail`      | string   | Email nhận                            |
| `subject`      | string   | Tiêu đề email                         |
| `templateName` | string   | Template Handlebars được dùng         |
| `status`       | string   | `SENT` hoặc `FAILED`                  |
| `errorMessage` | string   | Nội dung lỗi nếu gửi thất bại         |
| `payload`      | object   | Dữ liệu input dùng để render/gửi mail |
| `createdAt`    | datetime | Thời điểm ghi log                     |

---

## Luồng hoạt động

```
BE tạo/cập nhật task
        │
        ├── Xác định assignee / reviewer cần nhận thông báo
        │
        ├── [1] Render nội dung notification từ Handlebars
        │
        ├── [2] Lưu notification vào DB
        │
        ├── [3] Nếu user đang online → bắn WebSocket event
        │
        ├── [4] Render email từ Handlebars
        │
        ├── [5] Gửi email qua SendGrid
        │
        └── [6] Ghi email_logs với trạng thái SENT / FAILED
```

---

## WebSocket

## Endpoint

```
GET ws://localhost:3000/ws/notifications?userId=<USER_ID>
```

Có thể truyền `userId` qua query string. Backend hiện tại cũng hỗ trợ đọc từ header `x-user-id` nếu client WebSocket lib cho phép custom headers.

### Trạng thái Online / Offline

- Nếu user đang online và đã mở socket, backend sẽ push event realtime ngay.
- Nếu user offline, thông báo vẫn đã được lưu trong bảng `notifications`.
- Khi user mở lại app hoặc reload trang, FE phải gọi `GET /api/notifications` để lấy lại danh sách thông báo cũ.

---

## WebSocket Events

### 1. `notifications:connected`

Bắn sau khi kết nối WebSocket thành công.

```json
{
	"userId": 12
}
```

### 2. `notifications:new`

Bắn khi có thông báo mới cho user đang online.

```json
{
	"id": 101,
	"userId": 12,
	"type": "TASK_UPDATED_ASSIGNEE",
	"title": "Task được cập nhật: Fix login bug",
	"content": "Nam vừa cập nhật task \"Fix login bug\" và bạn là người phụ trách của task này.",
	"isRead": false,
	"readAt": null,
	"metadata": {
		"taskId": 88,
		"action": "updated",
		"role": "assignee"
	},
	"createdAt": "2026-03-11T10:30:00.000Z",
	"updatedAt": "2026-03-11T10:30:00.000Z"
}
```

---

## REST APIs

## 1. Lấy danh sách thông báo

### Endpoint

```
GET /api/notifications?page=1&limit=20
```

### Headers

| Header      | Required | Mô tả                  |
| ----------- | -------- | ---------------------- |
| `x-user-id` | ✅       | ID user đang đăng nhập |

### Response

```json
{
	"message": "Get notifications successfully!",
	"code": 200,
	"metadata": {
		"notifications": [
			{
				"id": 101,
				"userId": 12,
				"type": "TASK_CREATED_REVIEWER",
				"title": "Task được tạo: Build payment flow",
				"content": "Nam vừa tạo task \"Build payment flow\" và bạn là reviewer của task này.",
				"isRead": false,
				"readAt": null,
				"metadata": {
					"taskId": 88,
					"action": "created",
					"role": "reviewer"
				},
				"createdAt": "2026-03-11T10:30:00.000Z",
				"updatedAt": "2026-03-11T10:30:00.000Z"
			}
		],
		"page": {
			"total": 25,
			"currentPage": 1,
			"pages": 2
		}
	}
}
```

### Ghi chú

- FE phải gọi API này khi user load trang lần đầu.
- FE nên gọi lại sau khi reconnect socket để đồng bộ trạng thái chuẩn từ DB.

---

## 2. Đánh dấu thông báo đã đọc

### Endpoint

```
PATCH /api/notifications/:id/read
```

### Headers

| Header      | Required | Mô tả                  |
| ----------- | -------- | ---------------------- |
| `x-user-id` | ✅       | ID user đang đăng nhập |

### Response

```json
{
	"message": "Mark notification as read successfully!",
	"code": 200,
	"metadata": {
		"id": 101,
		"userId": 12,
		"isRead": true,
		"readAt": "2026-03-11T10:35:00.000Z"
	}
}
```

### Gợi ý dùng ở FE

- Gọi API khi user click vào notification item.
- Hoặc gọi khi user mở task detail từ notification.

---

## Trigger hiện tại

Backend đang gửi notification + email ở các trường hợp sau:

### 1. Tạo task có người phụ trách là mình

- Nếu task mới tạo có `assigneeId`, user đó sẽ nhận:
  - Notification trong DB
  - WebSocket event nếu đang online
  - Email thông báo

### 2. Cập nhật task có người phụ trách là mình

- Nếu task sau khi update có `assigneeId`, user đó sẽ nhận thông báo tương tự.

### 3. Task có người review là mình

- Nếu task có `reviewerId`, reviewer cũng sẽ nhận thông báo tương tự khi create/update task.

### 4. Comment on task

- TODO: chưa triển khai vì hiện tại chưa có module comment.

---

## Template Handlebars

### 1. Notification template

File:

```text
src/ui/task-notification.handlebars
```

Ví dụ output:

```text
Nam vừa cập nhật task "Fix login bug" và bạn là người phụ trách của task này.
```

### 2. Email template

File:

```text
src/ui/task-notification-email.handlebars
```

Email dùng cùng dữ liệu chính:

```json
{
	"recipientName": "An",
	"actorName": "Nam",
	"taskTitle": "Fix login bug",
	"actionText": "cập nhật",
	"roleText": "người phụ trách",
	"taskId": 88,
	"frontendUrl": "http://localhost:5173"
}
```

---

## Hướng dẫn FE

### 1. Mở socket khi user đăng nhập

```ts
const socket = new WebSocket(`ws://localhost:3000/ws/notifications?userId=${userId}`)

socket.onmessage = (event) => {
	const payload = JSON.parse(event.data)

	switch (payload.event) {
		case 'notifications:connected':
			break
		case 'notifications:new':
			// prepend notification vào state
			break
	}
}
```

### 2. Load thông báo cũ khi mở app hoặc reload trang

```ts
const response = await fetch('/api/notifications?page=1&limit=20', {
	headers: {
		'x-user-id': String(userId)
	}
})

const data = await response.json()
const notifications = data.metadata.notifications
```

### 3. Mark as read

```ts
await fetch(`/api/notifications/${notificationId}/read`, {
	method: 'PATCH',
	headers: {
		'x-user-id': String(userId)
	}
})
```

### 4. UI flow đề xuất

| Bước | Tình huống               | UI nên làm                                        |
| ---- | ------------------------ | ------------------------------------------------- |
| 1    | User mở app              | Gọi `GET /api/notifications` lấy dữ liệu cũ       |
| 2    | Socket connected         | Bật badge trạng thái realtime nếu cần             |
| 3    | Nhận `notifications:new` | Thêm item mới lên đầu list + tăng unread badge    |
| 4    | User click notification  | Gọi API mark as read + điều hướng tới task detail |
| 5    | Socket reconnect         | Re-fetch notifications để tránh miss event        |

---

## Lưu ý triển khai

- WebSocket chỉ dùng để nhận realtime event, không thay thế API fetch danh sách.
- Nguồn dữ liệu chuẩn vẫn là DB.
- Nếu socket miss event trong lúc mất kết nối, FE chỉ cần gọi lại `GET /api/notifications`.
- Hiện tại backend dùng `x-user-id` để xác định user cho REST API notification.
