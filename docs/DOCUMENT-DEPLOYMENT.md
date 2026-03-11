# Document Feature - Deployment Checklist

## ✅ Backend Implementation - COMPLETE

### Files Created

- ✅ `src/model/enums/document.enum.ts`
- ✅ `src/model/document.entity.ts`
- ✅ `src/model/dto/document.dto.ts`
- ✅ `src/repository/document.repository.ts`
- ✅ `src/services/document.service.ts`
- ✅ `src/controllers/document.controller.ts`
- ✅ `src/routes/document.route.ts`

### Files Modified

- ✅ `src/model/project.entity.ts` — added `documentIds` array column
- ✅ `src/model/task.entity.ts` — added `descriptionDocumentIds` + `resultDocumentIds` array columns
- ✅ `src/db/data-source.ts` — registered `Document` entity
- ✅ `src/routes/index.ts` — registered document router
- ✅ `src/config/cloudinary.config.ts` — increased timeout to 120s
- ✅ `src/services/upload/cloudinary.service.ts` — added `resourceType` parameter

### Features Implemented

#### Core Features

- ✅ Upload document to Cloudinary (auto-detect image vs raw)
- ✅ Auto-sync documentIds to Project/Task entities
- ✅ Query documents by project
- ✅ Query documents by task (with type filter)
- ✅ Delete document (auto-remove ID from arrays)
- ✅ Zod validation for FormData fields (string → number conversion)

#### Data Sync

- ✅ Upload PROJECT → auto-add to `project.documentIds`
- ✅ Upload TASK_DESCRIPTION → auto-add to `task.descriptionDocumentIds`
- ✅ Upload TASK_RESULT → auto-add to `task.resultDocumentIds`
- ✅ Delete → auto-remove ID from corresponding array

---

## 🚀 Next Steps

### 1. Restart Server

```bash
# Kill current process
npm run dev    # or your dev command
# Server will auto-create documents table + new columns in Project/Task
```

### 2. Test API Locally

**Upload a document:**

```bash
curl -X POST http://localhost:3000/api/document \
  -F "file=@spec.pdf" \
  -F "type=TASK_DESCRIPTION" \
  -F "projectId=13" \
  -F "taskId=42"
```

**Get project documents:**

```bash
curl http://localhost:3000/api/document/project/13
```

**Get task documents:**

```bash
curl http://localhost:3000/api/document/task/42
curl "http://localhost:3000/api/document/task/42?type=TASK_DESCRIPTION"
```

### 3. Frontend Implementation

Use the guide in `/docs/document-api.md` to implement:

- Upload form component
- Document list component (for Project)
- Separate document sections for Task (description + result)
- Delete button with confirmation

### 4. Database Verification

After restart, verify with:

```sql
-- Check documents table
SELECT COUNT(*) FROM documents;

-- Check array columns
SELECT id, "documentIds", "descriptionDocumentIds", "resultDocumentIds"
FROM projects LIMIT 1;

SELECT id, "descriptionDocumentIds", "resultDocumentIds"
FROM tasks LIMIT 1;
```

---

## 📚 Documentation Files

- ✅ `/docs/document-api.md` — Complete API reference for FE
- ✅ `/docs/DOCUMENT-IMPLEMENTATION.md` — Implementation details & architecture

---

## ✨ Validation Checklist (Post-Deployment)

After deploying, verify:

- [ ] **TypeScript compiles** without errors
- [ ] **Database schema** includes `documents` table
- [ ] **Project/Task tables** have array columns for document IDs
- [ ] **Cloudinary config** has 120s timeout
- [ ] **Document route** is mounted at `/api/document`
- [ ] **Multer** correctly saves uploaded files to `./src/upload/`
- [ ] **Upload returns** document object with URL
- [ ] **Project.documentIds** updated after PROJECT upload
- [ ] **Task arrays** updated after TASK\_\* uploads
- [ ] **Delete** removes ID from arrays
- [ ] **PDF uploads** get `.../raw/upload/...` URL
- [ ] **Image uploads** get `.../image/upload/...` URL

---

## 🐛 Troubleshooting

### Upload fails with timeout

→ Server timeout already increased to 120s (Cloudinary config)
→ Check if file size exceeds limits
→ Check network connectivity to Cloudinary

### Upload returns 500 error

→ Check if `/src/upload/` directory exists (it should)
→ Check `.env` has valid Cloudinary credentials
→ Check TypeORM synchronization completed (check database logs)

### documentIds not updated

→ Verify `projectIds` column type is `int[]` (ARRAY in PostgreSQL)
→ Verify service methods are actually called (add console.log if needed)
→ Check database migrations ran successfully

### Query returns empty

→ Ensure document was created in DB (query documents table directly)
→ Verify `type` enum value matches exactly
→ Check `projectId`/`taskId` is correct

---

## 📖 API Response Examples

### Successful Upload

```json
{
	"message": "Upload document successfully!",
	"status": 201,
	"metadata": {
		"id": 47,
		"name": "design-spec.docx",
		"url": "https://res.cloudinary.com/dvgqt1let/raw/upload/v1741689600/documents/project-13/abc123.docx",
		"mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"size": 102400,
		"type": "TASK_DESCRIPTION",
		"projectId": 13,
		"taskId": 42,
		"uploadedById": 7,
		"createdAt": "2026-03-11T10:00:00.000Z",
		"updatedAt": "2026-03-11T10:00:00.000Z"
	}
}
```

### Get Project Documents

```json
{
  "message": "Get project documents successfully!",
  "status": 200,
  "metadata": [
    {
      "id": 1,
      "name": "project-brief.pdf",
      "url": "https://res.cloudinary.com/.../raw/upload/...",
      "type": "PROJECT",
      "projectId": 13,
      "size": 512000,
      ...
    }
  ]
}
```

### Validation Error

```json
{
	"statusCode": 400,
	"message": "Invalid request data: type must be PROJECT, TASK_DESCRIPTION, or TASK_RESULT, taskId must be a positive number if provided",
	"isOperational": true
}
```

---

## 🎯 Summary

| Feature                | Status      | Notes                         |
| ---------------------- | ----------- | ----------------------------- |
| Document entity & enum | ✅ Complete | Indexed by projectId/taskId   |
| Upload to Cloudinary   | ✅ Complete | Auto-detects image vs raw     |
| Auto-sync IDs          | ✅ Complete | Updates Project/Task arrays   |
| Query APIs             | ✅ Complete | Type filtering available      |
| Delete with cleanup    | ✅ Complete | Removes ID from arrays        |
| DTO validation         | ✅ Complete | Converts form field strings   |
| Cloudinary timeout     | ✅ Complete | 120s for large files          |
| Documentation          | ✅ Complete | API + FE implementation guide |

**Ready for frontend integration! 🚀**
