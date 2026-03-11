# API: Generate Schedules + Tasks từ tài liệu (SSE)

## Endpoint

```
POST /api/project/:projectId/gantt/generate
```

**Content-Type:** `multipart/form-data`

| Field  | Type | Required | Mô tả                                    |
| ------ | ---- | -------- | ---------------------------------------- |
| `file` | File | ✅       | Tài liệu dự án (.pdf, .doc, .docx, .txt) |

**Response:** `text/event-stream` (SSE stream)

---

## Luồng hoạt động

```
FE upload file ──► BE nhận file
                    │
                    ├── [1] Gửi file lên AI service → sinh phases
                    │       event: phase_start
                    │
                    ├── [2] Lưu N schedules vào DB
                    │       event: schedules_done
                    │
                    ├── [3] Với mỗi schedule, gọi AI sinh tasks
                    │       event: task_progress  (bắt đầu sinh)
                    │       event: task_done      (sinh xong, đã lưu DB)
                    │       ... lặp lại N lần ...
                    │
                    └── [4] Kết thúc
                            event: complete
```

---

## SSE Events

### 1. `phase_start`

Bắn ngay khi bắt đầu phân tích tài liệu.

```json
{
	"message": "Đang phân tích tài liệu..."
}
```

### 2. `schedules_done`

Sau khi AI sinh xong phases và đã lưu vào DB.

```json
{
	"schedules": [
		{
			"id": 1,
			"name": "Phase 1 - Requirements Analysis",
			"description": "...",
			"startDate": 1710115200,
			"endDate": 1711324800,
			"status": "PLANNED",
			"color": "#6366f1",
			"projectId": 5,
			"sortOrder": 0
		}
	],
	"total": 4
}
```

### 3. `task_progress`

Bắn khi **bắt đầu** sinh tasks cho 1 schedule.

```json
{
	"scheduleIndex": 0,
	"scheduleName": "Phase 1 - Requirements Analysis",
	"totalSchedules": 4,
	"status": "generating"
}
```

### 4. `task_done`

Bắn khi sinh task **xong** cho 1 schedule. Tasks đã được lưu DB.

```json
{
	"scheduleIndex": 0,
	"scheduleName": "Phase 1 - Requirements Analysis",
	"tasksCreated": 5,
	"tasks": [
		{
			"id": 10,
			"title": "Gather business requirements",
			"description": "...",
			"status": "PENDING",
			"type": "RESEARCH",
			"priority": "HIGH",
			"startDate": 1710115200,
			"dueDate": 1710460800,
			"duration": null,
			"estimateEffort": 3,
			"scheduleId": 1,
			"projectId": 5,
			"sortOrder": 0
		}
	]
}
```

### 5. `task_error`

Nếu sinh tasks cho 1 schedule bị lỗi (schedule vẫn được lưu, chỉ tasks bị skip).

```json
{
	"scheduleIndex": 2,
	"scheduleName": "Phase 3 - Implementation",
	"error": "Request timeout khi gọi Python server..."
}
```

### 6. `complete`

Stream kết thúc thành công.

```json
{
	"totalSchedules": 4,
	"totalTasks": 18
}
```

### 7. `error`

Lỗi nghiêm trọng (không upload được file, AI service down, ...). Stream kết thúc ngay sau event này.

```json
{
	"message": "Không thể kết nối đến Python server..."
}
```

---

## Hướng dẫn FE

### Gọi API bằng `fetch` + ReadableStream

```ts
const formData = new FormData()
formData.append('file', file)

const response = await fetch(`/api/project/${projectId}/gantt/generate`, {
	method: 'POST',
	body: formData
})

const reader = response.body!.getReader()
const decoder = new TextDecoder()
let buffer = ''

while (true) {
	const { done, value } = await reader.read()
	if (done) break

	buffer += decoder.decode(value, { stream: true })
	const lines = buffer.split('\n')
	buffer = lines.pop() || ''

	let eventName = ''
	for (const line of lines) {
		if (line.startsWith('event: ')) {
			eventName = line.slice(7).trim()
		} else if (line.startsWith('data: ') && eventName) {
			const data = JSON.parse(line.slice(6))
			// handle event
			switch (eventName) {
				case 'phase_start': // ... break
				case 'schedules_done': // ... break
				case 'task_progress': // ... break
				case 'task_done': // ... break
				case 'task_error': // ... break
				case 'complete': // ... break
				case 'error': // ... break
			}
			eventName = ''
		}
	}
}
```

> **Lưu ý:** Không dùng `EventSource` vì nó chỉ hỗ trợ GET. Endpoint này là POST với multipart upload.

### Huỷ request

Dùng `AbortController`:

```ts
const controller = new AbortController()
fetch(url, { signal: controller.signal, ... })

// Khi user nhấn Cancel:
controller.abort()
```

### UI Flow đề xuất

| Bước | Event nhận được  | UI hiển thị                                     |
| ---- | ---------------- | ----------------------------------------------- |
| 1    | User chọn file   | Dropzone / file picker                          |
| 2    | `phase_start`    | Spinner + "Đang phân tích tài liệu..."          |
| 3    | `schedules_done` | Danh sách schedules hiện ra (mờ, chưa có tasks) |
| 4    | `task_progress`  | Schedule đang xử lý → hiện icon loading         |
| 5    | `task_done`      | Schedule xong → tick xanh + số tasks            |
| 6    | `complete`       | Nút "Đóng" / "Xem kết quả"                      |
| 7    | `error`          | Báo lỗi + nút "Thử lại"                         |

### Tính progress %

```ts
// Giai đoạn upload + phân tích: 0-20%
// Giai đoạn sinh tasks: 20-100%
const percent = 20 + (schedulesCompleted / totalSchedules) * 80
```
