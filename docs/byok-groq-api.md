# API: BYOK Groq API Key + Usage Tracking

## Mục tiêu

Backend hỗ trợ người dùng tự mang API key Groq của mình (BYOK), chọn key mặc định để dùng cho các request AI, và theo dõi usage token/time theo từng key.

---

## Thành phần backend

### 1. Bảng dữ liệu

#### `api_keys`

Lưu danh sách API key của từng user.

Các field chính:

| Field       | Type     | Mô tả                                |
| ----------- | -------- | ------------------------------------ |
| `id`        | number   | ID key                               |
| `name`      | string   | Nhãn gợi nhớ cho key                 |
| `key`       | string   | Key đã mã hóa (không lưu plain text) |
| `provider`  | string   | Nhà cung cấp, hiện tại là `groq`     |
| `isActive`  | boolean  | Trạng thái hoạt động của key         |
| `userId`    | number   | Chủ sở hữu key                       |
| `createdAt` | datetime | Thời điểm tạo                        |
| `updatedAt` | datetime | Thời điểm cập nhật                   |

#### `usages`

Lưu usage nhận từ response của Groq theo từng request thành công.

Các field chính:

| Field              | Type     | Mô tả                                                 |
| ------------------ | -------- | ----------------------------------------------------- |
| `id`               | number   | ID usage                                              |
| `apiKeyId`         | number   | Key đã dùng để gọi model                              |
| `promptTokens`     | number   | Số token input                                        |
| `completionTokens` | number   | Số token output                                       |
| `totalTokens`      | number   | Tổng token                                            |
| `reasoningTokens`  | number   | Reasoning token (có thể null hoặc thiếu)              |
| `promptTime`       | number   | Thời gian xử lý prompt                                |
| `completionTime`   | number   | Thời gian sinh completion                             |
| `totalTime`        | number   | Tổng thời gian xử lý                                  |
| `requestType`      | string   | Loại request: `chat` hoặc `vision`                    |
| `metadata`         | object   | Metadata mở rộng, ví dụ projectId, teamId, scheduleId |
| `createdAt`        | datetime | Thời điểm ghi usage                                   |

#### `users.selectedApiKeyId`

Lưu API key mặc định đang chọn của user để dùng khi backend gọi AI service.

---

## Luồng hoạt động

```text
FE tạo key BYOK
        │
        ├── [1] POST /api/api-keys
        │
        ├── [2] Backend validate key với Groq trước khi lưu
        │
        ├── [3] Backend mã hóa key và lưu vào bảng api_keys
        │
        ├── [4] FE chọn key mặc định qua PATCH /api/users/setting-api-key
        │
        ├── [5] Khi gọi các API AI, backend lấy selectedApiKeyId
        │
        ├── [6] Backend gửi key lên AI server qua header x_api_key
        │
        └── [7] Sau response thành công, backend trích usage và lưu bảng usages
```

---

## REST APIs

## 1. Tạo API key

### Endpoint

```text
POST /api/api-keys
```

### Headers

| Header      | Required | Mô tả             |
| ----------- | -------- | ----------------- |
| `x-user-id` | ✅       | ID user đăng nhập |

### Body

```json
{
	"name": "My Groq Key",
	"key": "gsk_xxx",
	"provider": "groq"
}
```

### Response

```json
{
	"message": "Create API key successfully!",
	"code": 201,
	"metadata": {
		"id": 1,
		"name": "My Groq Key",
		"provider": "groq",
		"isActive": true,
		"userId": 12,
		"createdAt": "2026-03-12T09:00:00.000Z"
	}
}
```

### Ghi chú

- Backend chỉ lưu key đã mã hóa.
- Key sẽ bị reject nếu không validate được với Groq.

---

## 2. Lấy danh sách API key + thống kê usage

### Endpoint

```text
GET /api/api-keys
```

### Headers

| Header      | Required | Mô tả             |
| ----------- | -------- | ----------------- |
| `x-user-id` | ✅       | ID user đăng nhập |

### Response

```json
{
	"message": "Get API keys successfully!",
	"code": 200,
	"metadata": [
		{
			"id": 1,
			"name": "My Groq Key",
			"provider": "groq",
			"isActive": true,
			"userId": 12,
			"createdAt": "2026-03-12T09:00:00.000Z",
			"totalTokensUsed": 5321,
			"isSelected": true
		}
	]
}
```

### Ghi chú

- `totalTokensUsed` là tổng từ bảng `usages` theo từng key.
- `isSelected` cho biết key mặc định hiện tại của user.

---

## 3. Cập nhật key

### Endpoint

```text
PATCH /api/api-keys/:id
```

### Headers

| Header      | Required | Mô tả             |
| ----------- | -------- | ----------------- |
| `x-user-id` | ✅       | ID user đăng nhập |

### Body

```json
{
	"name": "Team Groq Key",
	"isActive": false
}
```

### Ghi chú

- Có thể update `name`, `isActive` hoặc cả hai.
- Nếu tắt key đang được chọn mặc định, backend tự unset selected key của user.

---

## 4. Xóa key

### Endpoint

```text
DELETE /api/api-keys/:id
```

### Headers

| Header      | Required | Mô tả             |
| ----------- | -------- | ----------------- |
| `x-user-id` | ✅       | ID user đăng nhập |

### Response

```json
{
	"message": "Delete API key successfully!",
	"code": 200,
	"metadata": {
		"deleted": true
	}
}
```

---

## 5. Chọn key mặc định cho user

### Endpoint

```text
PATCH /api/users/setting-api-key
```

### Headers

| Header      | Required | Mô tả             |
| ----------- | -------- | ----------------- |
| `x-user-id` | ✅       | ID user đăng nhập |

### Body

```json
{
	"selectedApiKeyId": 1
}
```

Hoặc bỏ chọn key mặc định:

```json
{
	"selectedApiKeyId": null
}
```

### Response

```json
{
	"message": "Update selected API key successfully",
	"code": 200,
	"metadata": {
		"selectedApiKeyId": 1
	}
}
```

---

## 6. Lấy lịch sử usage của một key

### Endpoint

```text
GET /api/api-keys/:id/usages?page=1&limit=20
```

### Headers

| Header      | Required | Mô tả             |
| ----------- | -------- | ----------------- |
| `x-user-id` | ✅       | ID user đăng nhập |

### Query params

| Param   | Default | Mô tả                             |
| ------- | ------- | --------------------------------- |
| `page`  | 1       | Trang hiện tại                    |
| `limit` | 20      | Số bản ghi mỗi trang (tối đa 100) |

### Response

```json
{
	"message": "Get usage list successfully!",
	"code": 200,
	"metadata": {
		"usages": [
			{
				"id": 10,
				"apiKeyId": 1,
				"promptTokens": 224,
				"completionTokens": 1201,
				"totalTokens": 3425,
				"reasoningTokens": 399,
				"promptTime": 0.104,
				"completionTime": 2.588,
				"totalTime": 2.692,
				"requestType": "chat",
				"metadata": { "projectId": 5, "teamId": null },
				"createdAt": "2026-03-12T09:10:00.000Z"
			}
		],
		"page": {
			"total": 42,
			"currentPage": 1,
			"pages": 3
		}
	}
}
```

---

## 7. Tổng quan sử dụng của một key

### Endpoint

```text
GET /api/api-keys/:id/usages/overview
```

### Headers

| Header      | Required | Mô tả             |
| ----------- | -------- | ----------------- |
| `x-user-id` | ✅       | ID user đăng nhập |

### Response

```json
{
	"message": "Get usage overview successfully!",
	"code": 200,
	"metadata": {
		"apiKeyId": 1,
		"apiKeyName": "My Groq Key",
		"totalRequests": 42,
		"totalTokens": 143250,
		"totalPromptTokens": 49800,
		"totalCompletionTokens": 88050,
		"totalReasoningTokens": 5400,
		"avgTotalTime": 2.6917,
		"avgPromptTime": 0.1044,
		"avgCompletionTime": 2.5873,
		"totalChatRequests": 38,
		"totalVisionRequests": 4
	}
}
```

---

## Kết nối AI server

Khi backend gọi AI service nội bộ, nếu user có selected key hợp lệ thì backend sẽ đính kèm header sau:

```text
x_api_key: <GROQ_API_KEY>
```

Mục đích: AI server dùng key này để gọi Groq theo cơ chế BYOK.

---

## Hướng dẫn FE implement

### 1. Màn hình quản lý key

Luồng gợi ý:

1. Gọi GET /api/api-keys để load danh sách.
2. Hiển thị name, trạng thái active, totalTokensUsed, selected status.
3. Cho phép Create / Update / Delete key.

### 2. Chọn key mặc định

Khi user chọn một key từ UI:

```ts
await fetch('/api/users/setting-api-key', {
	method: 'PATCH',
	headers: {
		'Content-Type': 'application/json',
		'x-user-id': String(userId)
	},
	body: JSON.stringify({ selectedApiKeyId: keyId })
})
```

### 3. Hiển thị tổng quan usage của một key

```ts
// Gọi khi user mở modal chi tiết của một key
const res = await fetch(`/api/api-keys/${keyId}/usages/overview`, {
	headers: { 'x-user-id': String(userId) }
})
const { metadata } = await res.json()
// metadata.totalTokens, metadata.totalRequests, metadata.avgTotalTime...
```

### 4. Lấy lịch sử usage theo trang

```ts
const res = await fetch(`/api/api-keys/${keyId}/usages?page=1&limit=20`, {
	headers: { 'x-user-id': String(userId) }
})
const { metadata } = await res.json()
// metadata.usages — mảng bản ghi chi tiết
// metadata.page.total, metadata.page.pages
```

### 5. Gợi ý UX

| Bước | Tình huống                       | UI nên làm                                               |
| ---- | -------------------------------- | -------------------------------------------------------- |
| 1    | User mở trang cài đặt AI key     | Gọi GET /api/api-keys                                    |
| 2    | User tạo key                     | Gọi POST /api/api-keys, rồi reload list                  |
| 3    | User đổi key mặc định            | Gọi PATCH /api/users/setting-api-key                     |
| 4    | User tắt/xóa key mặc định        | Reload list để cập nhật trạng thái isSelected            |
| 5    | User click vào key để xem detail | Gọi GET /api/api-keys/:id/usages/overview hiển thị stats |
| 6    | User cuộn xem lịch sử chi tiết   | Gọi GET /api/api-keys/:id/usages?page=N để phân trang    |

---

## Lưu ý triển khai

- FE không bao giờ nhận lại raw key từ backend sau khi tạo.
- Nếu selected key không hợp lệ hoặc bị tắt, backend sẽ fallback sang luồng không BYOK.
- Usage chỉ được ghi khi request AI thành công và response có usage object.
- `reasoningTokens` có thể null khi provider/model không trả field này.
