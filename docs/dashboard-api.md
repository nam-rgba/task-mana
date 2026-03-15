# Dashboard API Documentation

## Overview

Dashboard API cung cấp các chỉ số thống kê về tasks của người dùng trong một khoảng thời gian nhất định.

## Endpoint

```
GET /api/dashboard/stats
```

## Query Parameters

| Parameter   | Type    | Required | Description                                                                                    |
| ----------- | ------- | -------- | ---------------------------------------------------------------------------------------------- |
| `startAt`   | number  | ✓        | Unix timestamp (giây) của ngày bắt đầu                                                         |
| `endAt`     | number  | ✓        | Unix timestamp (giây) của ngày kết thúc                                                        |
| `justForMe` | boolean | ✗        | Nếu `true` (mặc định), chỉ lấy tasks assigned cho user. Nếu `false`, lấy tất cả tasks của team |

## Headers

```
X-User-Id: {userId}
```

## Request Example

### cURL

```bash
curl -X GET "http://localhost:3000/api/dashboard/stats?startAt=1707897600&endAt=1710576000&justForMe=true" \
  -H "X-User-Id: 1"
```

### JavaScript (Fetch)

```javascript
const startAt = Math.floor(new Date('2024-02-14').getTime() / 1000) // 1707897600
const endAt = Math.floor(new Date('2024-03-16').getTime() / 1000) // 1710576000
const userId = 1
const justForMe = true

fetch(`http://localhost:3000/api/dashboard/stats?startAt=${startAt}&endAt=${endAt}&justForMe=${justForMe}`, {
	method: 'GET',
	headers: {
		'X-User-Id': userId
	}
})
	.then((res) => res.json())
	.then((data) => console.log(data))
```

### TypeScript (Axios)

```typescript
import axios from 'axios'

const getDashboardStats = async (userId: number, startAt: number, endAt: number, justForMe: boolean = true) => {
	const response = await axios.get('/api/dashboard/stats', {
		params: { startAt, endAt, justForMe },
		headers: {
			'X-User-Id': userId
		}
	})
	return response.data.data
}

// Usage
const startAt = Math.floor(new Date('2024-02-14').getTime() / 1000)
const endAt = Math.floor(new Date('2024-03-16').getTime() / 1000)
const data = await getDashboardStats(1, startAt, endAt)
```

## Response Structure

```json
{
	"statusCode": 200,
	"message": "Dashboard stats retrieved successfully",
	"data": {
		"stats": {
			"assignedTasks": 15,
			"completedTasks": 12,
			"totalStoryPoints": 48.5
		},
		"taskPerProjects": [
			{
				"projectId": 1,
				"projectName": "Mobile App",
				"count": 8
			},
			{
				"projectId": 2,
				"projectName": "Backend API",
				"count": 7
			}
		],
		"taskPerDays": [
			{
				"date": "2024-02-14",
				"count": 2
			},
			{
				"date": "2024-02-15",
				"count": 3
			},
			{
				"date": "2024-02-16",
				"count": 1
			}
		],
		"spPerDay": [
			{
				"date": "2024-02-14",
				"totalStoryPoints": 8
			},
			{
				"date": "2024-02-15",
				"totalStoryPoints": 13.5
			},
			{
				"date": "2024-02-16",
				"totalStoryPoints": 5
			}
		]
	}
}
```

## Response Fields Explanation

### `stats` (Chỉ số tổng hợp)

- **`assignedTasks`**: Tổng số tasks được gán cho user (hoặc team) trong khoảng thời gian
- **`completedTasks`**: Số tasks đã hoàn thành (status = DONE) trong khoảng thời gian
- **`totalStoryPoints`**: Tổng số story points (estimateEffort) của tất cả tasks

### `taskPerProjects` (Biểu đồ tròn - Pie Chart)

Mảng chứa số lượng tasks theo từng project.

- **`projectId`**: ID của project
- **`projectName`**: Tên project
- **`count`**: Số lượng tasks trong project đó

**Dùng cho**: Biểu đồ tròn (Pie Chart) để hiển thị phân bố công việc theo project

### `taskPerDays` (Biểu đồ cột/đường - Line Chart - Task Count)

Mảng chứa số lượng tasks được tạo/hoàn thành mỗi ngày.

- **`date`**: Ngày (format: YYYY-MM-DD)
- **`count`**: Số lượng tasks trong ngày đó

**Dùng cho**: Biểu đồ đường (Line Chart) hoặc cột (Bar Chart) để hiển thị xu hướng số tasks theo thời gian

### `spPerDay` (Biểu đồ đường - Line Chart - Story Points)

Mảng chứa tổng story points mỗi ngày.

- **`date`**: Ngày (format: YYYY-MM-DD)
- **`totalStoryPoints`**: Tổng story points trong ngày đó

**Dùng để**: Biểu đồ đường (Line Chart) để hiển thị xu hướng story points theo thời gian

## Error Responses

### 400 Bad Request - Missing Parameters

```json
{
	"statusCode": 400,
	"message": "startAt and endAt are required"
}
```

### 400 Bad Request - Invalid Unix Timestamps

```json
{
	"statusCode": 400,
	"message": "startAt and endAt must be unix timestamps"
}
```

### 400 Bad Request - Invalid Date Range

```json
{
	"statusCode": 400,
	"message": "startAt must be less than endAt"
}
```

### 400 Bad Request - Missing User ID

```json
{
	"statusCode": 400,
	"message": "Invalid user ID"
}
```

## Helper Function (JavaScript/TypeScript)

```typescript
/**
 * Convert Date to Unix timestamp
 */
function dateToUnix(date: Date): number {
	return Math.floor(date.getTime() / 1000)
}

/**
 * Get start and end of month
 */
function getMonthRange(date: Date) {
	const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
	const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)

	return {
		startAt: dateToUnix(startDate),
		endAt: dateToUnix(new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1))
	}
}

/**
 * Get start and end of week
 */
function getWeekRange() {
	const now = new Date()
	const first = now.getDate() - now.getDay() + 1 // adjust when day is Sunday

	const startDate = new Date(now.setDate(first))
	const endDate = new Date(startDate)
	endDate.setDate(endDate.getDate() + 7)

	return {
		startAt: dateToUnix(startDate),
		endAt: dateToUnix(endDate)
	}
}

// Usage
const monthRange = getMonthRange(new Date(2024, 1, 14)) // February 2024
console.log(monthRange)
// { startAt: 1704067200, endAt: 1706745600 }
```

## Frontend Implementation Example

### React Component

```typescript
import { useEffect, useState } from 'react';
import { LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface DashboardStats {
  stats: {
    assignedTasks: number;
    completedTasks: number;
    totalStoryPoints: number;
  };
  taskPerProjects: Array<{ projectId: number; projectName: string; count: number }>;
  taskPerDays: Array<{ date: string; count: number }>;
  spPerDay: Array<{ date: string; totalStoryPoints: number }>;
}

export function Dashboard() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startAt = Math.floor(startOfMonth.getTime() / 1000);
      const endAt = Math.floor(now.getTime() / 1000);

      const response = await fetch(
        `/api/dashboard/stats?startAt=${startAt}&endAt=${endAt}&justForMe=true`,
        {
          headers: {
            'X-User-Id': userId // từ auth context/localStorage
          }
        }
      );

      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data</div>;

  return (
    <div className="dashboard">
      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Tasks Assigned</h3>
          <p className="value">{data.stats.assignedTasks}</p>
        </div>
        <div className="stat-card">
          <h3>Tasks Completed</h3>
          <p className="value">{data.stats.completedTasks}</p>
        </div>
        <div className="stat-card">
          <h3>Story Points</h3>
          <p className="value">{data.stats.totalStoryPoints}</p>
        </div>
      </div>

      {/* Pie Chart - Tasks per Project */}
      <div className="chart-container">
        <h3>Tasks per Project</h3>
        <PieChart width={400} height={300}>
          <Pie
            data={data.taskPerProjects}
            dataKey="count"
            nameKey="projectName"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          />
          <Tooltip />
          <Legend />
        </PieChart>
      </div>

      {/* Line Chart - Tasks per Day */}
      <div className="chart-container">
        <h3>Tasks per Day</h3>
        <LineChart width={600} height={300} data={data.taskPerDays}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="count" stroke="#8884d8" />
        </LineChart>
      </div>

      {/* Line Chart - Story Points per Day */}
      <div className="chart-container">
        <h3>Story Points per Day</h3>
        <LineChart width={600} height={300} data={data.spPerDay}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="totalStoryPoints" stroke="#82ca9d" />
        </LineChart>
      </div>
    </div>
  );
}
```

## Notes

1. **Unix Timestamps**: Tất cả timestamps đều là Unix timestamp (số giây kể từ 01/01/1970 UTC)
2. **Date Format**: Trong response, dates được trả về dạng `YYYY-MM-DD`
3. **Story Points**: Sử dụng field `estimateEffort` từ Task entity
4. **Task Status**: Chỉ tasks có status = `DONE` được tính là completed tasks
5. **Group By Date**: Tất cả tasks được grouped theo ngày tạo task (`createdAt`)
6. **Timezone**: Dữ liệu được xử lý dựa trên UTC timezone
