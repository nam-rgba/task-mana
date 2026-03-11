# 📄 Document Feature - Hoàn thành!

## Yêu cầu ban đầu ✅

```
✅ Một tài liệu sẽ cần có projectId — để biết nó nằm ở project nào
✅ Mỗi task sẽ có 2 dạng tài liệu:
   1. Tài liệu mô tả (TASK_DESCRIPTION)
   2. Tài liệu kết quả thực hiện (TASK_RESULT)
✅ Cần có taskId và type (định nghĩa enum)
✅ Tài liệu được upload lên Cloudinary, lưu URL
✅ Upload trả về object Document chứa các thông tin trên
✅ Entity khác lưu documentIds arrays
   - Project: documentIds[]
   - Task: descriptionDocumentIds[], resultDocumentIds[]
✅ 1 project có 1 section tài liệu ở detail project
✅ Trong mỗi task có 2 section tài liệu
✅ Thiết kế interface + implement API
```

---

## 📁 Cấu trúc code

```
src/
├── model/
│   ├── document.entity.ts         ← Entity chính
│   ├── project.entity.ts          ← += documentIds[] (4 dòng)
│   ├── task.entity.ts             ← += 2 arrays (7 dòng)
│   ├── dto/
│   │   └── document.dto.ts        ← UploadDocumentSchema (Zod)
│   └── enums/
│       └── document.enum.ts       ← DocumentType enum
├── repository/
│   └── document.repository.ts     ← CRUD + query methods
├── services/
│   └── document.service.ts        ← Upload + auto-sync IDs
├── controllers/
│   └── document.controller.ts     ← 4 HTTP handlers
├── routes/
│   ├── document.route.ts          ← Route definition
│   └── index.ts                   ← += documentRouter (2 dòng)
└── db/
    └── data-source.ts            ← += Document entity (1 dòng)

docs/
├── document-api.md               ← FE implementation guide
├── DOCUMENT-IMPLEMENTATION.md    ← Technical architecture
└── DOCUMENT-DEPLOYMENT.md        ← Deployment checklist
```

---

## 🔌 API Endpoints

```
POST   /api/document                          ← Upload file
GET    /api/document/project/:projectId       ← Get project docs
GET    /api/document/task/:taskId             ← Get task docs
GET    /api/document/task/:taskId?type=X      ← Filter by type
DELETE /api/document/:id                      ← Delete with cleanup
```

---

## 🎯 Key Features

| Feature                 | Implemented | How                                                |
| ----------------------- | ----------- | -------------------------------------------------- |
| **Upload**              | ✅          | Multer → Cloudinary → Document entity              |
| **Auto ID sync**        | ✅          | Service tự cập nhật Project/Task arrays            |
| **Type validation**     | ✅          | Zod schema + enum check + string→number conversion |
| **Cascade delete**      | ✅          | Remove từ arrays khi delete document               |
| **File type detection** | ✅          | Image→image resource, Other→raw resource           |
| **Query filtering**     | ✅          | Optional type filter for tasks                     |
| **Error handling**      | ✅          | BadRequestError, NotFoundError validation          |

---

## 💾 Database Changes

### Tạo bảng: `documents`

```sql
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  mimeType VARCHAR(100),
  size INT,
  type ENUM, -- PROJECT | TASK_DESCRIPTION | TASK_RESULT
  projectId INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  taskId INT REFERENCES tasks(id) ON DELETE CASCADE,
  uploadedById INT,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON documents(projectId);
CREATE INDEX ON documents(taskId);
CREATE INDEX ON documents(type);
```

### Cập nhật: `projects` table

```sql
ALTER TABLE projects ADD COLUMN documentIds INT[] DEFAULT ARRAY[]::INT[];
```

### Cập nhật: `tasks` table

```sql
ALTER TABLE tasks ADD COLUMN descriptionDocumentIds INT[] DEFAULT ARRAY[]::INT[];
ALTER TABLE tasks ADD COLUMN resultDocumentIds INT[] DEFAULT ARRAY[]::INT[];
```

_(TypeORM sẽ tự chạy với `synchronize: true`)_

---

## 📊 Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ FRONTEND                                                 │
│                                                          │
│  [Upload Form]                                           │
│      ↓ FormData(file, type, projectId, taskId)          │
└─────────────────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ BACKEND: POST /api/document                              │
│                                                          │
│  1. Multer parses multipart → req.file + req.body       │
│  2. Zod validates schema (convert string→number)        │
│  3. CloudinaryService uploads (auto: image vs raw)      │
│  4. Document entity created with URL                    │
│  5. ✅ Service auto-updates:                            │
│     - project.documentIds += [id]                       │
│     - task.descriptionDocumentIds += [id]               │
│     - task.resultDocumentIds += [id]                    │
│  6. Return Document object                              │
└─────────────────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ FRONTEND                                                 │
│                                                          │
│  [Show Document] Link → download/view                   │
│  [Optional] Re-query Project/Task to get updated arrays │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Manual Test Commands

```bash
# Upload PROJECT document
curl -X POST http://localhost:3000/api/document \
  -F "file=@spec.pdf" \
  -F "type=PROJECT" \
  -F "projectId=13"

# Upload TASK_DESCRIPTION
curl -X POST http://localhost:3000/api/document \
  -F "file=@requirements.docx" \
  -F "type=TASK_DESCRIPTION" \
  -F "projectId=13" \
  -F "taskId=42"

# Get project documents
curl http://localhost:3000/api/document/project/13

# Get task description documents
curl "http://localhost:3000/api/document/task/42?type=TASK_DESCRIPTION"

# Get all task documents
curl http://localhost:3000/api/document/task/42

# Delete
curl -X DELETE http://localhost:3000/api/document/1
```

---

## 📖 Documentation Files

### 1. `docs/document-api.md`

- Interface TypeScript
- API endpoints detail
- Response examples
- FE implementation guide
- FormData usage
- File type handling

### 2. `docs/DOCUMENT-IMPLEMENTATION.md`

- Full architecture
- DB schema
- Auto-sync flow
- UI layout recommendations
- Testing checklist

### 3. `docs/DOCUMENT-DEPLOYMENT.md`

- Deployment checklist
- Restart instructions
- Verification queries
- Troubleshooting

---

## ✨ Mục tiêu đạt được

| Mục tiêu                 | Trạng thái                       |
| ------------------------ | -------------------------------- |
| Tài liệu có projectId    | ✅ Bắt buộc                      |
| 2 loại tài liệu cho Task | ✅ TASK_DESCRIPTION, TASK_RESULT |
| Type enum                | ✅ DocumentType enum             |
| Upload Cloudinary        | ✅ Auto image/raw detection      |
| Lưu URL                  | ✅ Permanent Cloudinary URL      |
| Return Document object   | ✅ Đầy đủ thông tin              |
| Lưu documentIds arrays   | ✅ Project + Task entities       |
| Project section          | ✅ GET /document/project/:id     |
| Task 2 sections          | ✅ Query với type filter         |
| Interface design         | ✅ TypeScript interfaces         |
| API implement            | ✅ 5 endpoints                   |

---

## 🚀 Bước tiếp theo

1. **Restart server** → TypeORM tự tạo schema
2. **Test API** → Dùng curl/Postman
3. **Implement FE** → Theo hướng dẫn trong `/docs/document-api.md`
4. **Deploy** → Checklist trong `/docs/DOCUMENT-DEPLOYMENT.md`

---

## 📞 Support

Nếu có vấn đề với:

- **Upload timeout** → Check Cloudinary timeout (đã set 120s)
- **Array columns** → Verify PostgreSQL version support (8.1+)
- **FE integration** → Check `document-api.md` examples
- **Type errors** → Run `npx tsc --noEmit` để check

---

✅ **Implementation completed successfully!** 🎉
