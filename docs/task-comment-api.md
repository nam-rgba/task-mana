# Task Comment API — Hướng dẫn FE implement

## Mục tiêu

API comment cho task theo mô hình **1 cấp** (không reply lồng nhau), trả dữ liệu theo thứ tự thời gian từ cũ đến mới.

- Có thể gửi comment chỉ text
- Có thể gửi comment chỉ file
- Có thể gửi cả text + file
- File đính kèm được lưu tập trung vào bảng `documents` với `type = COMMENT`

---

## Endpoint

Base: `/api/task`

### 1) Tạo comment

`POST /api/task/:id/comments`

- `:id` là `taskId`
- Header bắt buộc: `x-user-id`
- Content-Type: `multipart/form-data`

#### FormData

| Key          | Type   | Required | Ghi chú            |
| ------------ | ------ | -------- | ------------------ |
| `content`    | string | ❌       | Nội dung comment   |
| `attachment` | File   | ❌       | Ảnh/PDF/Word/Excel |

Quy tắc:

- Bắt buộc có ít nhất 1 trong 2 field: `content` hoặc `attachment`
- MIME được chấp nhận:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `image/gif`
  - `application/pdf`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - `application/vnd.ms-excel`
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

#### Response thành công (`201`)

```json
{
	"message": "Create task comment successfully!",
	"status": 201,
	"metadata": {
		"id": 101,
		"taskId": 42,
		"authorId": 7,
		"content": "Mình đã update theo flow mới",
		"documentId": 315,
		"document": {
			"id": 315,
			"name": "spec-v2.pdf",
			"url": "https://res.cloudinary.com/...",
			"mimeType": "application/pdf",
			"size": 204800,
			"type": "COMMENT",
			"projectId": 13,
			"taskId": 42,
			"uploadedById": 7,
			"createdAt": "2026-03-12T08:00:00.000Z",
			"updatedAt": "2026-03-12T08:00:00.000Z"
		},
		"author": {
			"id": 7,
			"name": "Nguyen Van A",
			"email": "a@company.com",
			"avatar": "https://...",
			"position": "Frontend"
		},
		"createdAt": "2026-03-12T08:00:00.000Z",
		"updatedAt": "2026-03-12T08:00:00.000Z"
	}
}
```

### 2) Lấy danh sách comment

`GET /api/task/:id/comments`

- `:id` là `taskId`
- Dữ liệu được sort theo `createdAt ASC` (cũ -> mới)

#### Response thành công (`200`)

```json
{
	"message": "Get task comments successfully!",
	"status": 200,
	"metadata": [
		{
			"id": 100,
			"taskId": 42,
			"authorId": 9,
			"content": "Bắt đầu xử lý task",
			"documentId": null,
			"document": null,
			"author": {
				"id": 9,
				"name": "Tran Thi B",
				"email": "b@company.com",
				"avatar": "https://...",
				"position": "Backend"
			},
			"createdAt": "2026-03-12T07:00:00.000Z",
			"updatedAt": "2026-03-12T07:00:00.000Z"
		},
		{
			"id": 101,
			"taskId": 42,
			"authorId": 7,
			"content": "Mình đã update theo flow mới",
			"documentId": 315,
			"document": {
				"id": 315,
				"name": "spec-v2.pdf",
				"url": "https://res.cloudinary.com/...",
				"mimeType": "application/pdf",
				"size": 204800,
				"type": "COMMENT",
				"projectId": 13,
				"taskId": 42,
				"uploadedById": 7,
				"createdAt": "2026-03-12T08:00:00.000Z",
				"updatedAt": "2026-03-12T08:00:00.000Z"
			},
			"author": {
				"id": 7,
				"name": "Nguyen Van A",
				"email": "a@company.com",
				"avatar": "https://...",
				"position": "Frontend"
			},
			"createdAt": "2026-03-12T08:00:00.000Z",
			"updatedAt": "2026-03-12T08:00:00.000Z"
		}
	]
}
```

---

## TypeScript gợi ý cho FE

```ts
export interface TaskCommentAuthor {
	id: number
	name: string
	email: string
	avatar?: string
	position?: string
}

export interface TaskCommentDocument {
	id: number
	name: string
	url: string
	mimeType?: string
	size?: number
	type: 'COMMENT'
	projectId: number
	taskId?: number
	uploadedById?: number
	createdAt: string
	updatedAt: string
}

export interface TaskComment {
	id: number
	taskId: number
	authorId: number
	content?: string
	documentId?: number
	document?: TaskCommentDocument | null
	author?: TaskCommentAuthor
	createdAt: string
	updatedAt: string
}
```

---

## Ví dụ FE call API

```ts
export async function createTaskComment(params: {
	taskId: number
	userId: number
	content?: string
	attachment?: File
}) {
	const formData = new FormData()
	if (params.content?.trim()) formData.append('content', params.content.trim())
	if (params.attachment) formData.append('attachment', params.attachment)

	const res = await fetch(`/api/task/${params.taskId}/comments`, {
		method: 'POST',
		headers: {
			'x-user-id': String(params.userId)
		},
		body: formData
	})

	if (!res.ok) {
		const error = await res.json().catch(() => ({}))
		throw new Error(error?.message || 'Create comment failed')
	}

	return res.json()
}

export async function getTaskComments(taskId: number) {
	const res = await fetch(`/api/task/${taskId}/comments`)
	if (!res.ok) {
		const error = await res.json().catch(() => ({}))
		throw new Error(error?.message || 'Get comments failed')
	}

	return res.json()
}
```

---

## FE lưu ý triển khai

- Render theo thứ tự backend trả về (đã là cũ -> mới)
- `document` có thể `null`, cần check trước khi render nút download/preview
- Với ảnh: preview trực tiếp bằng `document.url`
- Với PDF/Word/Excel: render icon + tên file, click mở tab mới
- Có thể optimistic update comment text, nhưng comment có file nên chờ response để lấy `document.id/url`
