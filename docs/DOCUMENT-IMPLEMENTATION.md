# Document Feature - Implementation Summary

## ✅ Công việc đã hoàn thành

### 1. Backend Implementation

#### A. Database/Entities

| File                               | Nội dung                                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `src/model/enums/document.enum.ts` | `DocumentType` enum: `PROJECT`, `TASK_DESCRIPTION`, `TASK_RESULT`                                       |
| `src/model/document.entity.ts`     | Document entity với tất cả các trường: name, url, mimeType, size, type, projectId, taskId, uploadedById |
| `src/model/project.entity.ts`      | ✅ Thêm `documentIds: number[]` array column                                                            |
| `src/model/task.entity.ts`         | ✅ Thêm `descriptionDocumentIds: number[]` + `resultDocumentIds: number[]`                              |

#### B. Repository Layer

| File                                    | Chức năng                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| `src/repository/document.repository.ts` | CRUD operations: `findById`, `findByProject`, `findByTask`, `create`, `remove` |

#### C. Service Layer

| File                               | Chức năng                                                              |
| ---------------------------------- | ---------------------------------------------------------------------- |
| `src/services/document.service.ts` | ✅ `uploadDocument` - tự động thêm document ID vào Project/Task arrays |
|                                    | ✅ `getProjectDocuments` - lấy tài liệu project                        |
|                                    | ✅ `getTaskDocuments` - lấy tài liệu task (filter theo type)           |
|                                    | ✅ `deleteDocument` - xóa + tự động xóa ID khỏi arrays                 |

#### D. Controller Layer

| File                                     | Endpoints                                                             |
| ---------------------------------------- | --------------------------------------------------------------------- |
| `src/controllers/document.controller.ts` | `upload`, `getProjectDocuments`, `getTaskDocuments`, `deleteDocument` |

#### E. Routes

| File                           | Route definition                                                                 |
| ------------------------------ | -------------------------------------------------------------------------------- |
| `src/routes/document.route.ts` | POST `/` (upload), GET `/project/:projectId`, GET `/task/:taskId`, DELETE `/:id` |
| `src/routes/index.ts`          | ✅ Mounted `/document` router                                                    |

#### F. DTO & Validation

| File                            | Nội dung                                                                          |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `src/model/dto/document.dto.ts` | `UploadDocumentSchema` - Zod validation (convert string → number for form fields) |

#### G. Config Updates

| File                                        | Update                                                     |
| ------------------------------------------- | ---------------------------------------------------------- |
| `src/db/data-source.ts`                     | ✅ Registered `Document` entity                            |
| `src/config/cloudinary.config.ts`           | ✅ Increased timeout from 30s → 120s                       |
| `src/services/upload/cloudinary.service.ts` | ✅ Added `resourceType` param ('image' \| 'raw' \| 'auto') |

---

## 📋 API Endpoints

### Upload Document

```
POST /api/document
Content-Type: multipart/form-data

Form fields:
- file: File (PDF, image, Word doc...)
- type: "PROJECT" | "TASK_DESCRIPTION" | "TASK_RESULT"
- projectId: number
- taskId?: number (required if type is TASK_*)

Response 201:
{
  "message": "Upload document successfully!",
  "metadata": {
    "id": 1,
    "name": "spec.pdf",
    "url": "https://res.cloudinary.com/.../raw/upload/...",
    "mimeType": "application/pdf",
    "size": 204800,
    "type": "TASK_DESCRIPTION",
    "projectId": 13,
    "taskId": 42,
    "createdAt": "2026-03-11T10:00:00.000Z",
    "updatedAt": "2026-03-11T10:00:00.000Z"
  }
}
```

### Get Project Documents

```
GET /api/document/project/:projectId

Response 200: Document[] with type = PROJECT
```

### Get Task Documents

```
GET /api/document/task/:taskId
GET /api/document/task/:taskId?type=TASK_DESCRIPTION
GET /api/document/task/:taskId?type=TASK_RESULT

Response 200: Document[] matching the type filter
```

### Delete Document

```
DELETE /api/document/:id

Response 200: { metadata: null }
```

---

## 🔄 Auto-sync Flow

```
1. FE uploads file → POST /api/document
   ↓
2. Backend saves to Cloudinary (decides: image vs raw)
   ↓
3. Document record created in DB
   ↓
4. ✅ Auto-update:
   - If type='PROJECT' → project.documentIds += [id]
   - If type='TASK_DESCRIPTION' → task.descriptionDocumentIds += [id]
   - If type='TASK_RESULT' → task.resultDocumentIds += [id]
   ↓
5. Return Document object with ID + URL to FE

Deletion:
1. FE calls DELETE /api/document/:id
   ↓
2. ✅ Auto-remove ID from arrays
3. Delete from DB
```

---

## 🎨 UI Layout (Recommended)

### Project Detail Page

```
[Project Detail]
├── Basic Info
├── Schedules
├── Milestones
└── 📎 Project Documents
    ├── [spec.pdf]  [View/Download]
    ├── [brief.docx] [View/Download]
    └── [+ Upload Document]
```

### Task Detail Page

```
[Task Detail]
├── Task Info
├── 📋 Description Documents    (GET /task/:id?type=TASK_DESCRIPTION)
│   ├── [requirements.pdf]
│   └── [+ Upload Description]
│
└── ✅ Result Documents         (GET /task/:id?type=TASK_RESULT)
    ├── [result.zip]
    └── [+ Upload Result]
```

---

## 🛠️ Frontend Implementation Guide

### 1. Upload Helper

```typescript
async function uploadDocument(
	file: File,
	payload: { type: DocumentType; projectId: number; taskId?: number }
): Promise<Document> {
	const formData = new FormData()
	formData.append('file', file)
	formData.append('type', payload.type)
	formData.append('projectId', String(payload.projectId))
	if (payload.taskId) formData.append('taskId', String(payload.taskId))

	const response = await fetch('/api/document', {
		method: 'POST',
		body: formData
		// 👉 KHÔNG set Content-Type header
	})
	return response.json()
}
```

### 2. Query Documents

```typescript
// Project documents
const projectDocs = await fetch(`/api/document/project/${projectId}`).then((r) => r.json())

// Task description docs
const descDocs = await fetch(`/api/document/task/${taskId}?type=TASK_DESCRIPTION`).then((r) => r.json())

// Task result docs
const resultDocs = await fetch(`/api/document/task/${taskId}?type=TASK_RESULT`).then((r) => r.json())
```

### 3. Delete Document

```typescript
await fetch(`/api/document/${docId}`, { method: 'DELETE' })
```

---

## 📝 Note về File Types

| Type                     | Cloudinary resource_type | URL Pattern            | Browser Behavior                       |
| ------------------------ | ------------------------ | ---------------------- | -------------------------------------- |
| **PDF, Word, Excel**     | `raw`                    | `.../raw/upload/...`   | Tải về (or inline nếu browser support) |
| **Ảnh (PNG, JPG, WebP)** | `image`                  | `.../image/upload/...` | Display trực tiếp                      |

Chọn tự động:

```typescript
const isImage = file.mimetype.startsWith('image/')
const resourceType = isImage ? 'image' : 'raw'
```

---

## ✨ Key Features

✅ **Automatic ID syncing** — không cần FE update Project/Task sau upload  
✅ **Type validation** — Zod schema checks enum + required fields  
✅ **Cloudinary integration** — uploads to CDN, returns permanent URLs  
✅ **Support for all file types** — auto-detects image vs raw  
✅ **Cascade delete** — removing document auto-cleans arrays  
✅ **Organized folder structure** — `documents/project-{id}/` on Cloudinary

---

## 🧪 Testing Checklist

- [ ] Upload PROJECT document → check `project.documentIds` updated
- [ ] Upload TASK_DESCRIPTION → check `task.descriptionDocumentIds` updated
- [ ] Upload TASK_RESULT → check `task.resultDocumentIds` updated
- [ ] Query project docs → returns only type=PROJECT
- [ ] Query task docs with filter → returns filtered by type
- [ ] Delete document → ID removed from arrays
- [ ] PDF upload → URL has `.../raw/upload/...`
- [ ] Image upload → URL has `.../image/upload/...`
- [ ] FormData without Content-Type header → works correctly
