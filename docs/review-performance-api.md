# API: User Skills + AI Review Performance

Tài liệu này dành cho FE để implement:

1. Cập nhật `skills` cho user profile.
2. Gọi API dashboard hiệu suất team (không gọi AI) để render danh sách user + metrics.
3. Khi user bấm review AI cho 1 thành viên cụ thể, gọi API AI review theo `userId`.

---

## 1) User skills

### Field mới trong user

`skills` là mảng chuỗi tự do, dùng để mô tả kỹ năng của user.

Ràng buộc backend:

- Tối đa 20 phần tử.
- Mỗi phần tử là string, không rỗng sau khi trim.
- Mỗi phần tử tối đa 20 ký tự.

### Update profile

#### Endpoint

```text
PUT /api/users/profile
```

#### Headers

| Header      | Required | Mô tả             |
| ----------- | -------- | ----------------- |
| `x-user-id` | ✅       | ID user đăng nhập |

#### Body ví dụ

```json
{
	"name": "Nguyen Van A",
	"position": "Backend Developer",
	"yearOfExperience": 3,
	"skills": ["NodeJS", "TypeScript", "PostgreSQL"]
}
```

#### Response

```json
{
	"message": "Update user profile successfully",
	"code": 201,
	"metadata": {
		"id": 12,
		"email": "a@raise.dev",
		"name": "Nguyen Van A",
		"position": "Backend Developer",
		"yearOfExperience": 3,
		"skills": ["NodeJS", "TypeScript", "PostgreSQL"]
	}
}
```

#### FE notes

- Nên giới hạn input ngay trên UI theo rule backend để tránh lỗi.
- Khi render profile, dùng `skills ?? []` để tránh null-safety issue.

---

## 1.5) Lấy danh sách tất cả skills trong hệ thống

API này trả về danh sách skill đã tồn tại trong hệ thống, dùng để suggest autocomplete khi cập nhật profile.

### Endpoint

```text
GET /api/skills
```

### Headers

Không yêu cầu, công khai

### Response

```json
{
	"message": "Get all skills successfully",
	"code": 200,
	"metadata": {
		"skills": ["NodeJS", "PostgreSQL", "React", "TypeScript"],
		"total": 4
	}
}
```

### FE notes

- Dùng list này làm autocomplete suggestions khi user chỉnh sửa skills của mình.
- Hệ thống tự tạo skill mới nếu user nhập skill chưa tồn tại khi update profile.
- Nếu user nhập skill trùng (khác hoa thường), backend tự gộp và giữ 1 skill duy nhất.

---

## 2) Team Performance Dashboard (không gọi AI)

API này dùng để render dashboard trước. Không truyền `userId`, chỉ cần `teamId + fromAt + toAt`.

### Endpoint

```text
POST /api/task/performance-dashboard
```

### Headers

| Header      | Required | Mô tả             |
| ----------- | -------- | ----------------- |
| `x-user-id` | ✅       | ID user đăng nhập |

### Body

```json
{
	"teamId": 3,
	"fromAt": 1735689600,
	"toAt": 1738367999
}
```

### Validate

- `teamId`, `fromAt`, `toAt` bắt buộc là số nguyên dương.
- `fromAt <= toAt`.

### Metrics trả về cho từng user

- `totalTasks`: tổng số task trong kỳ.
- `completedTasks`: số task hoàn thành.
- `completionRate`: tỷ lệ hoàn thành (%) = `completedTasks / totalTasks * 100`.
- `onTimeCompletedTasks`: số task hoàn thành đúng hạn (`completedAt <= dueDate`).
- `onTimeCompletionRate`: tỷ lệ hoàn thành đúng hạn (%) = `onTimeCompletedTasks / completedTasks * 100`.
- `totalStoryPoints`: tổng story point của task trong kỳ (`estimateEffort`).
- `storyPointsAchieved`: story point đạt được từ task hoàn thành.

### Response mẫu

```json
{
	"message": "Get team performance dashboard successfully!",
	"code": 200,
	"metadata": {
		"period": {
			"fromAt": 1735689600,
			"toAt": 1738367999
		},
		"teamId": 3,
		"totals": {
			"totalTasks": 40,
			"completedTasks": 29,
			"onTimeCompletedTasks": 21,
			"totalStoryPoints": 118,
			"storyPointsAchieved": 84,
			"completionRate": 72.5,
			"onTimeCompletionRate": 72.41
		},
		"users": [
			{
				"user": {
					"id": 12,
					"name": "Nguyen Van A",
					"email": "a@raise.dev",
					"avatar": null,
					"position": "Backend Developer",
					"skills": ["NodeJS", "TypeScript"],
					"yearOfExperience": 3
				},
				"metrics": {
					"totalTasks": 10,
					"completedTasks": 8,
					"onTimeCompletedTasks": 6,
					"completionRate": 80,
					"onTimeCompletionRate": 75,
					"totalStoryPoints": 30,
					"storyPointsAchieved": 24
				}
			}
		]
	}
}
```

### FE flow đề xuất

1. FE gọi `/api/task/performance-dashboard` để render bảng/dashboard cho team.
2. User chọn 1 thành viên từ list.
3. FE gọi API AI review performance (bên dưới) với `userId` của thành viên đã chọn.

---

## 3) AI Review Performance

API này nhận khoảng thời gian unix (seconds), backend tự query dữ liệu user + task + task comments trong team rồi gọi AI endpoint `/ai/llm/review_performance`.

### Endpoint

```text
POST /api/task/ai-review-performance
```

### Headers

| Header      | Required | Mô tả                                                                       |
| ----------- | -------- | --------------------------------------------------------------------------- |
| `x-user-id` | ✅       | ID người gọi API (dùng selected API key của user này để gọi AI + lưu usage) |

### Body

```json
{
	"userId": 12,
	"teamId": 3,
	"fromAt": 1735689600,
	"toAt": 1738367999
}
```

### Validate

- `userId`, `teamId`, `fromAt`, `toAt` bắt buộc là số nguyên dương.
- `fromAt <= toAt`.
- `userId` phải là thành viên active trong `teamId`.

### Backend tự thu thập dữ liệu trước khi gọi AI

- `user`: id, name, email, position, yearOfExperience, skills.
- `tasks`: các task user đảm nhận trong khoảng thời gian, gồm:
  - title, description
  - difficulty (từ priority)
  - estimateEffort, actualEffort
  - startDate, dueDate, completedAt
  - completionTimeSeconds
  - comments (author + content + createdAt)

### Response mẫu

```json
{
	"message": "AI reviewed performance successfully!",
	"code": 200,
	"metadata": {
		"review": {
			"performance_review": "...",
			"improvement_suggestions": "...",
			"usage": {
				"completion_tokens": 492,
				"prompt_tokens": 487,
				"total_tokens": 979
			}
		},
		"sourceData": {
			"user": {
				"id": 12,
				"name": "Nguyen Van A",
				"skills": ["NodeJS", "TypeScript"]
			},
			"period": {
				"fromAt": 1735689600,
				"toAt": 1738367999
			},
			"tasks": []
		}
	}
}
```

### Usage tracking

- Usage được lưu tự động vào bảng `usages` với:
  - `requestScope = "performance"`
  - `requestType = "chat"`
  - `metadata`: `targetUserId`, `teamId`, `fromAt`, `toAt`, `taskCount`

### FE implementation notes

- FE gửi unix timestamp theo **seconds** (không phải milliseconds).
- Có thể hiển thị:
  - `metadata.review.performance_review`
  - `metadata.review.improvement_suggestions`
  - thống kê token/time từ `metadata.review.usage` nếu cần.
- Có thể dùng `metadata.sourceData` để debug dữ liệu input AI khi QA/UAT.
