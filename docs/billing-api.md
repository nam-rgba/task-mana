# Plan & Billing API — VNPAY Integration

> **Mô hình:** Plan gắn với **cá nhân** (User). Khi user mua Pro/Enterprise, tất cả team mà user tham gia sẽ được hưởng tính năng của plan đó.

## Base URL

```
http://localhost:3000/api
```

## Auth Headers

Các endpoint có 🔒 yêu cầu 2 headers sau:

```
x-client-id: <userId>
token: <accessToken>
```

---

## Response Format

### Success

```json
{
	"message": "string",
	"code": 200,
	"metadata": {}
}
```

### Error

```json
{
	"status": "error",
	"code": 400,
	"message": "string"
}
```

---

## TypeScript Interfaces

```typescript
// ===================== ENUMS =====================

export type PlanName = 'FREE' | 'PRO' | 'ENTERPRISE'
export type BillingCycle = 'MONTHLY' | 'YEARLY'
export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED'

// ===================== PLAN =====================

export interface PlanFeatures {
	aiAssistant: boolean
	advancedAnalytics: boolean
	prioritySupport: boolean
	customBranding: boolean
	apiAccess: boolean
	exportReports: boolean
}

export interface Plan {
	id: number
	name: PlanName
	displayName: string // "Free" | "Pro" | "Enterprise"
	description: string
	monthlyPrice: number // VNĐ — 0 nếu Free
	yearlyPrice: number // VNĐ — 0 nếu Free
	maxMembers: number
	maxProjects: number
	maxStorage: number // MB
	features: PlanFeatures
	isActive: boolean
	createdAt: string // ISO 8601
	updatedAt: string
}

// ===================== SUBSCRIPTION =====================

export interface Subscription {
	id: number
	userId: number
	planId: number
	plan: Plan
	billingCycle: BillingCycle
	startDate: string // ISO 8601
	endDate: string // ISO 8601 — dùng để hiển thị ngày hết hạn
	status: SubscriptionStatus
	autoRenew: boolean
	createdAt: string
	updatedAt: string
}

// ===================== ORDER =====================

export interface Order {
	id: number
	orderCode: string // e.g. "ORD-20260301120000-ABC123"
	userId: number
	planId: number
	plan: Plan
	amount: number // VNĐ
	billingCycle: BillingCycle
	status: OrderStatus
	vnpTxnRef: string | null
	vnpTransactionNo: string | null
	vnpResponseCode: string | null
	vnpPayDate: string | null // format "YYYYMMDDHHmmss"
	paidAt: string | null // ISO 8601
	createdAt: string
	updatedAt: string
}

// ===================== REQUESTS =====================

export interface CreatePaymentRequest {
	planId: number
	billingCycle: BillingCycle
}

export interface RefundRequest {
	orderCode: string
	amount: number // VNĐ, không được vượt quá order.amount
	reason: string // tối đa 500 ký tự
}

// ===================== RESPONSES =====================

export interface CreatePaymentResponse {
	paymentUrl: string // URL redirect sang VNPAY gateway
	orderCode: string
	amount: number // VNĐ
	planName: string
	billingCycle: BillingCycle
}

// ===================== DASHBOARD ANALYTICS =====================

export interface DashboardOverview {
	totalRevenue: number
	totalOrders: number
	totalPaidOrders: number
	totalPendingOrders: number
	totalFailedOrders: number
	totalRefundedOrders: number
	activeSubscriptions: number
	subscriptionsByPlan: {
		planId: number
		planName: string
		count: number
	}[]
}

export interface MonthlyRevenueData {
	month: number // 1-12
	revenue: number // VNĐ
	orderCount: number
	newSubscriptions: number
}

export interface RevenueByPlan {
	planId: number
	planName: string
	revenue: number
	orderCount: number
}

export interface YearlyRevenueReport {
	year: number
	monthlyData: MonthlyRevenueData[]
	revenueByPlan: RevenueByPlan[]
	summary: {
		totalRevenue: number
		totalOrders: number
		totalNewSubscriptions: number
		averageMonthlyRevenue: number
	}
}

export interface MonthlyRevenueReport {
	year: number
	month: number
	revenueByPlan: RevenueByPlan[]
	summary: {
		totalRevenue: number
		totalOrders: number
	}
	recentOrders: RecentOrder[]
}

export interface RecentOrder {
	id: number
	orderCode: string
	amount: number
	status: OrderStatus
	billingCycle: BillingCycle
	planName: string
	userName: string
	userEmail: string
	paidAt: string | null
	createdAt: string
}

export type ApiResponse<T> = {
	message: string
	code: number
	metadata: T
}
```

---

## Endpoints

---

### 1. `GET /api/plan` — Danh sách tất cả plans

**Auth:** Không cần

**Response:** `ApiResponse<Plan[]>`

```json
{
	"message": "Get plans successfully!",
	"code": 200,
	"metadata": [
		{
			"id": 1,
			"name": "FREE",
			"displayName": "Free",
			"description": "Dành cho cá nhân, bắt đầu miễn phí với các tính năng cơ bản.",
			"monthlyPrice": 0,
			"yearlyPrice": 0,
			"maxMembers": 5,
			"maxProjects": 3,
			"maxStorage": 500,
			"features": {
				"aiAssistant": false,
				"advancedAnalytics": false,
				"prioritySupport": false,
				"customBranding": false,
				"apiAccess": false,
				"exportReports": false
			},
			"isActive": true
		},
		{
			"id": 2,
			"name": "PRO",
			"displayName": "Pro",
			"description": "Dành cho chuyên gia, nhiều tính năng nâng cao.",
			"monthlyPrice": 299000,
			"yearlyPrice": 2990000,
			"maxMembers": 25,
			"maxProjects": 20,
			"maxStorage": 5000,
			"features": {
				"aiAssistant": true,
				"advancedAnalytics": true,
				"prioritySupport": false,
				"customBranding": false,
				"apiAccess": true,
				"exportReports": true
			},
			"isActive": true
		},
		{
			"id": 3,
			"name": "ENTERPRISE",
			"displayName": "Enterprise",
			"description": "Dành cho doanh nghiệp lớn, không giới hạn.",
			"monthlyPrice": 999000,
			"yearlyPrice": 9990000,
			"maxMembers": 999,
			"maxProjects": 999,
			"maxStorage": 50000,
			"features": {
				"aiAssistant": true,
				"advancedAnalytics": true,
				"prioritySupport": true,
				"customBranding": true,
				"apiAccess": true,
				"exportReports": true
			},
			"isActive": true
		}
	]
}
```

---

### 2. `GET /api/plan/:id` — Chi tiết plan

**Auth:** Không cần

**Params:** `id` — Plan ID

**Response:** `ApiResponse<Plan>`

---

### 3. 🔒 `GET /api/billing/subscription` — Subscription hiện tại của user

**Auth:** Cần (userId lấy từ header `x-client-id`)

**Response:** `ApiResponse<Subscription | null>`

> **Lưu ý:**
>
> - `metadata === null` → user đang dùng **Free plan** (chưa mua gói nào)
> - `metadata.status === 'EXPIRED'` → gói đã hết hạn, cần gia hạn
> - `metadata.endDate` → dùng để hiển thị countdown hoặc ngày hết hạn

```json
{
	"message": "Get subscription successfully!",
	"code": 200,
	"metadata": {
		"id": 1,
		"userId": 5,
		"planId": 2,
		"plan": {
			"id": 2,
			"name": "PRO",
			"displayName": "Pro",
			"monthlyPrice": 299000,
			"yearlyPrice": 2990000,
			"features": {
				"maxProjects": -1,
				"aiAccess": true,
				"prioritySupport": true
			}
		},
		"billingCycle": "MONTHLY",
		"startDate": "2026-03-01T12:00:00.000Z",
		"endDate": "2026-04-01T12:00:00.000Z",
		"status": "ACTIVE",
		"autoRenew": false
	}
}
```

---

### 4. 🔒 `POST /api/billing/create-payment` — Tạo order & lấy VNPAY payment URL

**Auth:** Cần

**Request body:**

```json
{
	"planId": 2,
	"billingCycle": "MONTHLY"
}
```

**Response:** `ApiResponse<CreatePaymentResponse>`

```json
{
	"message": "Payment created successfully!",
	"code": 201,
	"metadata": {
		"paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=29900000&vnp_Command=pay&...",
		"orderCode": "ORD-20260301120000-ABC123",
		"amount": 299000,
		"planName": "Pro",
		"billingCycle": "MONTHLY"
	}
}
```

**Xử lý FE:**

```typescript
const res = await fetch('/api/billing/create-payment', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'x-client-id': userId,
		token: accessToken
	},
	body: JSON.stringify({ planId: 2, billingCycle: 'MONTHLY' })
})

const { metadata } = await res.json()

// Redirect user sang VNPAY gateway
window.location.href = metadata.paymentUrl
```

**Các lỗi có thể trả về:**

| Code | Message                               |
| ---- | ------------------------------------- |
| 404  | Plan not found                        |
| 400  | This plan is not available            |
| 400  | You already have this plan active     |
| 400  | Cannot create payment for a free plan |

---

### 5. `GET /api/billing/vnpay-return` — VNPAY callback (redirect về FE)

**Auth:** Không cần — VNPAY gọi tự động sau khi user thanh toán xong

Server nhận request từ VNPAY, xác thực rồi **redirect 302** sang:

```
# Thành công
{FRONTEND_URL}/billing/result?status=success&orderCode=ORD-xxx

# Thất bại
{FRONTEND_URL}/billing/result?status=failed&orderCode=ORD-xxx&code=<vnpResponseCode>
```

**FE cần tạo trang `/billing/result`:**

```typescript
const params = new URLSearchParams(window.location.search)

const status = params.get('status') // 'success' | 'failed'
const orderCode = params.get('orderCode')
const errorCode = params.get('code') // chỉ có khi failed
```

**VNPAY Response Codes thường gặp:**

| Code | Ý nghĩa                                          |
| ---- | ------------------------------------------------ |
| `00` | Giao dịch thành công                             |
| `07` | Trừ tiền thành công (nghi ngờ gian lận)          |
| `09` | Chưa đăng ký Internet Banking                    |
| `10` | Xác thực thông tin thẻ/tài khoản sai quá 3 lần   |
| `11` | Đã hết hạn chờ thanh toán                        |
| `12` | Thẻ/Tài khoản bị khóa                            |
| `24` | Khách hàng hủy giao dịch                         |
| `51` | Tài khoản không đủ số dư                         |
| `65` | Vượt quá hạn mức giao dịch trong ngày            |
| `75` | Ngân hàng thanh toán đang bảo trì                |
| `79` | Nhập sai mật khẩu thanh toán quá số lần quy định |
| `99` | Lỗi khác                                         |

---

### 6. `GET /api/billing/vnpay-ipn` — IPN server-to-server callback

**Không cần FE xử lý.** VNPAY gọi endpoint này trực tiếp tới server (song song với return URL). Server tự động:

- Verify checksum HMAC-SHA512
- Cập nhật Order status → `PAID` hoặc `FAILED`
- Tạo Subscription mới cho user (nếu thanh toán thành công)
- Lưu PaymentHistory

---

### 7. 🔒 `GET /api/billing/orders` — Lịch sử orders của user

**Auth:** Cần (userId lấy từ header `x-client-id`)

**Query params (optional):**

```
?page=1&limit=10
```

**Response:** `ApiResponse<{ data: Order[], total: number }>`

```json
{
	"message": "Get orders successfully!",
	"code": 200,
	"metadata": {
		"data": [
			{
				"id": 1,
				"orderCode": "ORD-20260301120000-ABC123",
				"userId": 5,
				"planId": 2,
				"plan": { "id": 2, "name": "PRO", "displayName": "Pro" },
				"amount": 299000,
				"billingCycle": "MONTHLY",
				"status": "PAID",
				"vnpTransactionNo": "14057247",
				"vnpPayDate": "20260301120530",
				"paidAt": "2026-03-01T12:05:30.000Z",
				"createdAt": "2026-03-01T12:00:00.000Z"
			}
		],
		"total": 1
	}
}
```

---

### 8. 🔒 `GET /api/billing/transaction-history` — Lịch sử giao dịch của user

**Auth:** Cần (userId lấy từ header `x-client-id`)

**Query params (optional):**

```
?page=1&limit=10
```

**Response:** `ApiResponse<{ data: PaymentHistory[], total: number }>`

```json
{
	"message": "Get transaction history successfully!",
	"code": 200,
	"metadata": {
		"data": [
			{
				"id": 10,
				"orderId": 1,
				"userId": 5,
				"action": "PAID",
				"ipAddress": null,
				"rawData": { "vnp_ResponseCode": "00", "source": "return_url_fallback" },
				"createdAt": "2026-03-01T12:05:30.000Z",
				"order": {
					"orderCode": "ORD-20260301120000-ABC123",
					"amount": 299000,
					"billingCycle": "MONTHLY",
					"status": "PAID",
					"plan": { "id": 2, "name": "PRO", "displayName": "Pro" }
				}
			}
		],
		"total": 3
	}
}
```

**PaymentAction values:**

| Action     | Mô tả                          |
| ---------- | ------------------------------ |
| `CREATED`  | Order được tạo, chờ thanh toán |
| `PAID`     | Thanh toán thành công          |
| `FAILED`   | Thanh toán thất bại            |
| `REFUNDED` | Đã hoàn tiền                   |

---

### 9. 🔒 `GET /api/billing/query-transaction/:orderCode` — Truy vấn trạng thái GD từ VNPAY

**Auth:** Cần

**Params:** `orderCode` — Mã order (e.g. `ORD-20260301120000-ABC123`)

**Response:** `ApiResponse<Record<string, any>>` — Raw data từ VNPAY

> **Dùng khi:** Order bị trạng thái `PENDING` quá lâu (IPN bị miss/timeout), cần check lại với VNPAY để đồng bộ trạng thái.

---

### 10. 🔒 `POST /api/billing/refund` — Yêu cầu hoàn tiền

**Auth:** Cần (chỉ **chủ order** mới được hoàn tiền)

**Request body:**

```json
{
	"orderCode": "ORD-20260301120000-ABC123",
	"amount": 299000,
	"reason": "Không hài lòng với dịch vụ"
}
```

**Response:** `ApiResponse<Record<string, any>>` — Raw data từ VNPAY refund API

> **Điều kiện:** Order phải ở trạng thái `PAID`. Sau khi hoàn tiền thành công, subscription của user sẽ bị huỷ.

**Các lỗi có thể trả về:**

| Code | Message                                  |
| ---- | ---------------------------------------- |
| 404  | Order not found                          |
| 400  | Only paid orders can be refunded         |
| 400  | Refund amount cannot exceed order amount |
| 400  | You can only refund your own orders      |

---

## Admin APIs

> **Yêu cầu:** Cần đảm bảo middleware kiểm tra quyền admin trên các route này.

### 11. 🔒 `GET /api/billing/admin/orders` — Tất cả orders (Admin)

**Auth:** Cần (Admin)

**Query params (optional):**

```
?page=1&limit=20
```

**Response:** `ApiResponse<{ data: Order[], total: number }>`

```json
{
	"message": "Get all orders successfully!",
	"code": 200,
	"metadata": {
		"data": [
			{
				"id": 1,
				"orderCode": "ORD-20260301120000-ABC123",
				"userId": 5,
				"user": { "id": 5, "email": "user@example.com", "name": "Nguyen Van A" },
				"planId": 2,
				"plan": { "id": 2, "name": "PRO", "displayName": "Pro" },
				"amount": 299000,
				"billingCycle": "MONTHLY",
				"status": "PAID",
				"paidAt": "2026-03-01T12:05:30.000Z",
				"createdAt": "2026-03-01T12:00:00.000Z"
			}
		],
		"total": 150
	}
}
```

---

### 12. 🔒 `GET /api/billing/admin/transaction-history` — Tất cả lịch sử giao dịch (Admin)

**Auth:** Cần (Admin)

**Query params (optional):**

```
?page=1&limit=20
```

**Response:** `ApiResponse<{ data: PaymentHistory[], total: number }>`

```json
{
	"message": "Get all transaction history successfully!",
	"code": 200,
	"metadata": {
		"data": [
			{
				"id": 10,
				"orderId": 1,
				"userId": 5,
				"user": { "id": 5, "email": "user@example.com", "name": "Nguyen Van A" },
				"action": "PAID",
				"rawData": { "vnp_ResponseCode": "00" },
				"createdAt": "2026-03-01T12:05:30.000Z",
				"order": {
					"orderCode": "ORD-20260301120000-ABC123",
					"amount": 299000,
					"billingCycle": "MONTHLY",
					"status": "PAID",
					"plan": { "id": 2, "name": "PRO", "displayName": "Pro" }
				}
			}
		],
		"total": 500
	}
}
```

---

## Dashboard Analytics APIs

> **Yêu cầu:** Admin authentication. Các API này dùng để render dashboard doanh thu/doanh số.

### 13. 🔒 `GET /api/billing/admin/dashboard/overview` — Tổng quan dashboard

**Auth:** Cần (Admin)

**Response:** `ApiResponse<DashboardOverview>`

```json
{
	"message": "Get dashboard overview successfully!",
	"code": 200,
	"metadata": {
		"totalRevenue": 15000000,
		"totalOrders": 50,
		"totalPaidOrders": 45,
		"totalPendingOrders": 3,
		"totalFailedOrders": 1,
		"totalRefundedOrders": 1,
		"activeSubscriptions": 42,
		"subscriptionsByPlan": [
			{ "planId": 2, "planName": "Pro", "count": 35 },
			{ "planId": 3, "planName": "Enterprise", "count": 7 }
		]
	}
}
```

**FE Usage:**

```typescript
// Hiển thị stat cards
<StatCard title="Tổng doanh thu" value={formatCurrency(metadata.totalRevenue)} />
<StatCard title="Đơn thành công" value={metadata.totalPaidOrders} />
<StatCard title="Subscriptions" value={metadata.activeSubscriptions} />

// Pie chart subscriptions by plan
<PieChart data={metadata.subscriptionsByPlan} />
```

---

### 14. 🔒 `GET /api/billing/admin/dashboard/revenue/:year` — Doanh thu theo năm

**Auth:** Cần (Admin)

**Params:** `year` — Năm cần xem (e.g. `2026`)

**Response:** `ApiResponse<YearlyRevenueReport>`

```json
{
	"message": "Get revenue by year successfully!",
	"code": 200,
	"metadata": {
		"year": 2026,
		"monthlyData": [
			{ "month": 1, "revenue": 1200000, "orderCount": 4, "newSubscriptions": 3 },
			{ "month": 2, "revenue": 2500000, "orderCount": 8, "newSubscriptions": 7 },
			{ "month": 3, "revenue": 3200000, "orderCount": 10, "newSubscriptions": 9 }
			// ... tháng 4-12
		],
		"revenueByPlan": [
			{ "planId": 2, "planName": "Pro", "revenue": 8970000, "orderCount": 30 },
			{ "planId": 3, "planName": "Enterprise", "revenue": 9990000, "orderCount": 10 }
		],
		"summary": {
			"totalRevenue": 18960000,
			"totalOrders": 40,
			"totalNewSubscriptions": 36,
			"averageMonthlyRevenue": 1580000
		}
	}
}
```

**FE Usage:**

```typescript
// Line/Bar chart doanh thu theo tháng
<BarChart
	data={metadata.monthlyData}
	xKey="month"
	yKey="revenue"
	label="Doanh thu"
/>

// Thêm line cho orderCount hoặc newSubscriptions
<LineChart
	data={metadata.monthlyData}
	lines={[
		{ key: 'revenue', label: 'Doanh thu', color: '#10B981' },
		{ key: 'orderCount', label: 'Đơn hàng', color: '#3B82F6' }
	]}
/>

// Summary cards
<SummaryCard title="Tổng doanh thu năm" value={formatCurrency(metadata.summary.totalRevenue)} />
<SummaryCard title="TB tháng" value={formatCurrency(metadata.summary.averageMonthlyRevenue)} />
```

---

### 15. 🔒 `GET /api/billing/admin/dashboard/revenue/:year/:month` — Doanh thu theo tháng

**Auth:** Cần (Admin)

**Params:**

- `year` — Năm (e.g. `2026`)
- `month` — Tháng (1-12)

**Response:** `ApiResponse<MonthlyRevenueReport>`

```json
{
	"message": "Get revenue by month successfully!",
	"code": 200,
	"metadata": {
		"year": 2026,
		"month": 3,
		"revenueByPlan": [
			{ "planId": 2, "planName": "Pro", "revenue": 2093000, "orderCount": 7 },
			{ "planId": 3, "planName": "Enterprise", "revenue": 999000, "orderCount": 1 }
		],
		"summary": {
			"totalRevenue": 3092000,
			"totalOrders": 8
		},
		"recentOrders": [
			{
				"id": 45,
				"orderCode": "ORD-20260315120000-XYZ789",
				"amount": 299000,
				"status": "PAID",
				"planName": "Pro",
				"userName": "Tran Van B",
				"paidAt": "2026-03-15T10:30:00.000Z",
				"createdAt": "2026-03-15T10:25:00.000Z"
			}
		]
	}
}
```

**FE Usage:**

```typescript
// Donut chart doanh thu theo plan
<DonutChart
	data={metadata.revenueByPlan}
	nameKey="planName"
	valueKey="revenue"
/>

// Table đơn hàng gần đây trong tháng
<OrderTable orders={metadata.recentOrders} />
```

---

### 16. 🔒 `GET /api/billing/admin/dashboard/recent-orders` — Đơn hàng gần nhất

**Auth:** Cần (Admin)

**Query params (optional):**

```
?limit=10
```

**Response:** `ApiResponse<RecentOrder[]>`

```json
{
	"message": "Get recent orders successfully!",
	"code": 200,
	"metadata": [
		{
			"id": 50,
			"orderCode": "ORD-20260320143000-ABC123",
			"amount": 999000,
			"status": "PAID",
			"billingCycle": "MONTHLY",
			"planName": "Enterprise",
			"userName": "Nguyen Van A",
			"userEmail": "a@example.com",
			"paidAt": "2026-03-20T14:35:00.000Z",
			"createdAt": "2026-03-20T14:30:00.000Z"
		},
		{
			"id": 49,
			"orderCode": "ORD-20260320100000-DEF456",
			"amount": 299000,
			"status": "PENDING",
			"billingCycle": "MONTHLY",
			"planName": "Pro",
			"userName": "Le Thi C",
			"userEmail": "c@example.com",
			"paidAt": null,
			"createdAt": "2026-03-20T10:00:00.000Z"
		}
	]
}
```

**FE Usage:**

```typescript
// Table/List đơn hàng gần đây trên dashboard
<RecentOrdersTable orders={metadata} />

// Badge cho status
<StatusBadge status={order.status} />
// PAID → green, PENDING → yellow, FAILED → red, REFUNDED → gray
```

---

## FE Flow tổng quan

```
┌─────────────────────────────────────────────────────────────┐
│  1. Trang /plans                                            │
│     → GET /api/plan                                         │
│     → Hiển thị bảng giá Free / Pro / Enterprise            │
│     → Cho phép chọn billingCycle (Monthly / Yearly)         │
└─────────────────────────────────────────────────────────────┘
                          │ User bấm "Nâng cấp"
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Gọi POST /api/billing/create-payment                    │
│     → Body: { planId, billingCycle }                         │
│     → Nhận paymentUrl                                        │
│     → window.location.href = paymentUrl (redirect)          │
└─────────────────────────────────────────────────────────────┘
                          │ VNPAY gateway
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  3. User nhập thẻ / tài khoản / OTP trên VNPAY             │
└─────────────────────────────────────────────────────────────┘
                          │ VNPAY redirect về
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Server nhận GET /api/billing/vnpay-return               │
│     → Verify checksum                                        │
│     → Redirect sang /billing/result?status=success|failed   │
│                                                             │
│     Đồng thời: VNPAY gọi /api/billing/vnpay-ipn (IPN)       │
│     → Server tự cập nhật DB, tạo Subscription cho user      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Trang /billing/result                                   │
│     → Đọc query params: status, orderCode                   │
│     → Hiển thị kết quả thanh toán                           │
│     → Gọi GET /api/billing/subscription                     │
│     → Cập nhật UI: plan name, features, ngày hết hạn        │
└─────────────────────────────────────────────────────────────┘
```

---

## Logic phân quyền theo Plan

User mua Pro → **tất cả team mà user tham gia** đều được hưởng tính năng Pro.

```typescript
// FE: Kiểm tra quyền tính năng dựa trên user's plan
async function getUserPlan(userId: number): Promise<Subscription | null> {
	const res = await fetch('/api/billing/subscription', {
		headers: { 'x-client-id': String(userId), token: accessToken }
	})
	const { metadata } = await res.json()
	return metadata // null = Free plan
}

// Kiểm tra feature
function canUseFeature(subscription: Subscription | null, feature: keyof PlanFeatures): boolean {
	if (!subscription) return false // Free plan
	return subscription.plan.features[feature] === true
}
```

---

## Lưu ý quan trọng

1. **IPN vs Return URL:** VNPAY IPN là nguồn đáng tin cậy nhất (server-to-server, có checksum). **Return URL cũng xử lý payment như fallback** — nếu order vẫn ở `PENDING` khi user được redirect về, server sẽ tự cập nhật order + tạo subscription. Điều này đảm bảo hoạt động đúng cả khi chạy localhost (VNPAY không gọi được IPN).

2. **Polling fallback:** Nếu user về trang result nhưng subscription chưa active, FE có thể poll `GET /api/billing/subscription` mỗi 3 giây trong tối đa 30 giây.

3. **Free plan:** Không có subscription record trong DB. `metadata === null` khi gọi `GET /api/billing/subscription` đồng nghĩa với Free plan.

4. **Plan gắn với User, không phải Team:** User mua Pro thì mọi team user tham gia đều được hưởng tính năng Pro. Không cần chọn team khi mua plan.
