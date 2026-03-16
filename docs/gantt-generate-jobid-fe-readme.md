# Gantt Generate với `jobId` (FE Guide ngắn)

## Mục tiêu

Khi gọi API generate bằng SSE, nếu client mất mạng giữa chừng thì FE vẫn có thể:

- giữ `jobId`
- reconnect SSE (nếu muốn)
- hoặc poll API trạng thái job để biết backend đã chạy tới đâu.

## API liên quan

- `POST /project/:projectId/gantt/generate` (SSE)
  - Header response có `X-Generate-Job-Id`
  - SSE event đầu tiên: `job_started` với payload có `jobId`
  - Nếu đã có job đang chạy cho cùng `projectId + user`, backend trả event `job_reused` (không start lại từ đầu)
- `GET /project/:projectId/gantt/generate/jobs/:jobId`
  - Trả trạng thái hiện tại của job.

## Payload trạng thái job (GET)

```json
{
	"jobId": "uuid",
	"projectId": 123,
	"userId": 10,
	"status": "running | completed | failed",
	"startedAt": "2026-03-16T08:00:00.000Z",
	"updatedAt": "2026-03-16T08:00:10.000Z",
	"endedAt": "2026-03-16T08:01:00.000Z",
	"clientDisconnected": false,
	"totalSchedules": 5,
	"processedSchedules": 2,
	"totalTasks": 14,
	"currentScheduleName": "Phase 3",
	"error": "..."
}
```

## FE flow khuyến nghị

1. Gọi `POST /generate` bằng SSE.
2. Nhận `jobId` từ `X-Generate-Job-Id` hoặc event `job_started`.
3. Lưu `jobId` vào state + `localStorage` (key theo `projectId`).
4. Nếu SSE bị `error`/`close` bất thường:
   - Hiện trạng thái "đang reconnect".
   - Bắt đầu poll `GET /generate/jobs/:jobId` mỗi 2-3 giây.
   - **Không `POST /generate` lại với file mới** khi job cũ còn `running`.
5. Nếu `status = completed` hoặc `failed`:
   - Dừng poll.
   - Xóa `jobId` khỏi `localStorage`.
6. Nếu user vào lại trang và còn `jobId` trong storage:
   - gọi `GET /generate/jobs/:jobId` để resume trạng thái ngay.

## Mapping UI nhanh

- `running`: progress bar = `processedSchedules / max(totalSchedules, 1)`
- `completed`: hiển thị tổng schedule/task, refresh gantt data.
- `failed`: hiển thị `error` và nút retry.

## Lưu ý backend hiện tại

- Job được lưu in-memory (không persistent), TTL khoảng 1 giờ sau khi job kết thúc.
- Nếu server restart thì job state bị mất.
