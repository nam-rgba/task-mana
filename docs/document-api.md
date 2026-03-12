# Document API — Hướng dẫn tích hợp Frontend

## Tổng quan

Tính năng quản lý tài liệu (**Document**) cho phép đính kèm file vào **Project** và **Task**. Mỗi tài liệu được lưu trữ trên Cloudinary và metadata được lưu trong database.

### Phân loại tài liệu (`DocumentType`)

| Enum value         | Dùng cho | Mô tả                                    |
| ------------------ | -------- | ---------------------------------------- |
| `PROJECT`          | Project  | Tài liệu tổng quan của project           |
| `TASK_DESCRIPTION` | Task     | Tài liệu mô tả task (đầu vào)            |
| `TASK_RESULT`      | Task     | Tài liệu kết quả thực hiện task (đầu ra) |
| `COMMENT`          | Task     | File đính kèm cho comment của task       |

---

## Cấu trúc dữ liệu

### Document Entity

Tài liệu được lưu trong bảng `documents` với các trường:

| Trường         | Kiểu     | Bắt buộc | Mô tả                                                         |
| -------------- | -------- | -------- | ------------------------------------------------------------- |
| `id`           | `number` | ✅       | Primary key                                                   |
| `name`         | `string` | ✅       | Tên file gốc                                                  |
| `url`          | `string` | ✅       | URL Cloudinary                                                |
| `mimeType`     | `string` | ❌       | MIME type của file                                            |
| `size`         | `number` | ❌       | Kích thước file (byte)                                        |
| `type`         | `enum`   | ✅       | `PROJECT` \| `TASK_DESCRIPTION` \| `TASK_RESULT` \| `COMMENT` |
| `projectId`    | `number` | ✅       | Project chứa document này                                     |
| `taskId`       | `number` | ❌       | Task (chỉ khi type là task)                                   |
| `uploadedById` | `number` | ❌       | User ID người upload                                          |
| `createdAt`    | `Date`   | ✅       | Timestamp tạo                                                 |
| `updatedAt`    | `Date`   | ✅       | Timestamp cập nhật                                            |

### Project Entity — mở rộng

Thêm trường:

```typescript
@Column('int', { array: true, nullable: true, default: [] })
documentIds?: number[]  // Lưu IDs của tài liệu PROJECT
```

### Task Entity — mở rộng

Thêm 2 trường:

```typescript
@Column('int', { array: true, nullable: true, default: [] })
descriptionDocumentIds?: number[]  // IDs tài liệu TASK_DESCRIPTION

@Column('int', { array: true, nullable: true, default: [] })
resultDocumentIds?: number[]  // IDs tài liệu TASK_RESULT
```

---

## Interface TypeScript (cho FE)

```typescript
export enum DocumentType {
	PROJECT = 'PROJECT',
	TASK_DESCRIPTION = 'TASK_DESCRIPTION',
	TASK_RESULT = 'TASK_RESULT',
	COMMENT = 'COMMENT'
}

export interface Document {
	id: number
	name: string // Tên file gốc
	url: string // URL Cloudinary để xem/download
	mimeType?: string // VD: "application/pdf", "image/png"
	size?: number // Kích thước file (byte)
	type: DocumentType
	projectId: number
	taskId?: number // Chỉ có khi type = TASK_DESCRIPTION | TASK_RESULT
	uploadedById?: number
	createdAt: string
	updatedAt: string
}
```

---

## API Endpoints

Base URL: `/api/document`

---

### 1. Upload tài liệu

```
POST /api/document
Content-Type: multipart/form-data
```

**Form fields:**

| Field       | Type          | Bắt buộc           | Mô tả                                                         |
| ----------- | ------------- | ------------------ | ------------------------------------------------------------- |
| `file`      | File          | ✅                 | File cần upload (PDF, Word, Excel, ảnh...)                    |
| `type`      | string (enum) | ✅                 | `PROJECT` \| `TASK_DESCRIPTION` \| `TASK_RESULT` \| `COMMENT` |
| `projectId` | number        | ✅                 | ID của project                                                |
| `taskId`    | number        | Khi `type` là task | ID của task                                                   |

**Quy tắc validation:**

- `type = PROJECT` → **không được** truyền `taskId`
- `type = TASK_DESCRIPTION`, `TASK_RESULT` hoặc `COMMENT` → **phải** truyền `taskId`

**Response `201`:**

```json
{
	"message": "Upload document successfully!",
	"status": 201,
	"metadata": {
		"id": 1,
		"name": "spec-v1.pdf",
		"url": "https://res.cloudinary.com/xxx/raw/upload/v.../documents/project-13/abc.pdf",
		"mimeType": "application/pdf",
		"size": 204800,
		"type": "TASK_DESCRIPTION",
		"projectId": 13,
		"taskId": 42,
		"uploadedById": 7,
		"createdAt": "2026-03-11T10:00:00.000Z",
		"updatedAt": "2026-03-11T10:00:00.000Z"
	}
}
```

**Ví dụ fetch:**

```typescript
async function uploadDocument(
	file: File,
	payload: {
		type: DocumentType
		projectId: number
		taskId?: number
	}
) {
	const formData = new FormData()
	formData.append('file', file)
	formData.append('type', payload.type)
	formData.append('projectId', String(payload.projectId))
	if (payload.taskId) formData.append('taskId', String(payload.taskId))

	const res = await fetch('/api/document', {
		method: 'POST',
		body: formData
		// KHÔNG set Content-Type header — để browser tự set boundary
	})
	return res.json()
}
```

---

### 2. Lấy tài liệu của Project

```
GET /api/document/project/:projectId
```

Trả về tất cả tài liệu có `type = PROJECT` của project đó.

**Response `200`:**

```json
{
	"message": "Get project documents successfully!",
	"status": 200,
	"metadata": [
		{
			"id": 1,
			"name": "project-brief.pdf",
			"url": "https://res.cloudinary.com/...",
			"mimeType": "application/pdf",
			"size": 512000,
			"type": "PROJECT",
			"projectId": 13,
			"taskId": null,
			"createdAt": "2026-03-11T10:00:00.000Z",
			"updatedAt": "2026-03-11T10:00:00.000Z"
		}
	]
}
```

---

### 3. Lấy tài liệu của Task

```
GET /api/document/task/:taskId
GET /api/document/task/:taskId?type=TASK_DESCRIPTION
GET /api/document/task/:taskId?type=TASK_RESULT
```

Không truyền `type` → trả về cả 2 loại.

**Response `200`:**

```json
{
  "message": "Get task documents successfully!",
  "status": 200,
  "metadata": [
    {
      "id": 2,
      "name": "design-spec.docx",
      "url": "https://res.cloudinary.com/...",
      "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "size": 102400,
      "type": "TASK_DESCRIPTION",
      "projectId": 13,
      "taskId": 42,
      "createdAt": "2026-03-11T10:00:00.000Z",
      "updatedAt": "2026-03-11T10:00:00.000Z"
    },
    {
      "id": 3,
      "name": "result-report.pdf",
      "url": "https://res.cloudinary.com/...",
      "type": "TASK_RESULT",
      "projectId": 13,
      "taskId": 42,
      ...
    }
  ]
}
```

---

### 4. Xóa tài liệu

```
DELETE /api/document/:id
```

**Response `200`:**

```json
{
	"message": "Delete document successfully!",
	"status": 200,
	"metadata": null
}
```

**Response `404`:** nếu không tìm thấy document.

---

## Gợi ý thiết kế UI

### Project Detail Page

Thêm section **"Tài liệu dự án"** trong trang chi tiết project:

```
[Project Detail]
├── Thông tin chung
├── Lịch trình (Schedule)
├── Milestones
└── 📎 Tài liệu dự án          ← GET /api/document/project/:projectId
    ├── [File 1] spec.pdf        ← url link mở tab mới
    ├── [File 2] brief.docx
    └── [+ Tải lên tài liệu]    ← POST /api/document { type: "PROJECT", projectId }
```

### Task Detail Page / Modal

Thêm 2 section riêng biệt trong task detail:

```
[Task Detail]
├── Thông tin task
├── 📋 Tài liệu mô tả            ← GET /api/document/task/:taskId?type=TASK_DESCRIPTION
│   ├── [File] requirements.pdf
│   └── [+ Upload mô tả]         ← POST { type: "TASK_DESCRIPTION", projectId, taskId }
│
└── ✅ Tài liệu kết quả          ← GET /api/document/task/:taskId?type=TASK_RESULT
    ├── [File] result.zip
    └── [+ Upload kết quả]       ← POST { type: "TASK_RESULT", projectId, taskId }
```

---

## Lưu ý quan trọng

### Tự động cập nhật documentIds

Khi **upload** hoặc **xóa** tài liệu, hệ thống **tự động** cập nhật mảng `documentIds` trong Project/Task:

- **Upload PROJECT** → `project.documentIds += [documentId]`
- **Upload TASK_DESCRIPTION** → `task.descriptionDocumentIds += [documentId]`
- **Upload TASK_RESULT** → `task.resultDocumentIds += [documentId]`
- **Xóa document** → Tự động loại bỏ ID khỏi mảng tương ứng

**FE không cần** gọi update Project/Task sau upload — chỉ cần query lại Project/Task detail hoặc sử dụng document ID trả về.

### Định dạng file

- **File PDF, Word, Excel** → Cloudinary lưu dạng `raw` → URL dạng `.../raw/upload/...`
  - Trình duyệt sẽ **tải về** hoặc hiển thị inline tùy browser
  - Khuyến nghị dùng `<a href={url} download>` để luôn tải về
- **Ảnh** → Cloudinary lưu dạng `image` → URL dạng `.../image/upload/...`
  - Có thể hiển thị trực tiếp trong `<img src={url}>`

### FormData và multipart/form-data

- Sử dụng `FormData` khi upload, **KHÔNG** set header `Content-Type: multipart/form-data`
  - Browser tự động set với boundary
- Multer parser sẽ đặt field text vào `req.body` và file vào `req.file`
- Zod schema sẽ tự convert string `"13"` → number `13` cho `projectId` và `taskId`

---

## Lưu ý khác

- Nên hiển thị icon theo `mimeType` để UX tốt hơn (PDF icon, Word icon...).
- `url` trả về là permanent URL, có thể dùng trực tiếp cho `<a href>` hoặc `window.open`.
- Không cần set `Content-Type: multipart/form-data` khi dùng `FormData` — browser tự xử lý.
