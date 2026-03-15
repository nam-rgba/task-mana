# Dashboard API - Frontend Implementation Guide

## Quick Start Example

### Setup & Call API

```typescript
// dashboardService.ts
import axios from 'axios'

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'

interface DashboardStatsResponse {
	stats: {
		assignedTasks: number
		completedTasks: number
		totalStoryPoints: number
	}
	taskPerProjects: Array<{
		projectId: number
		projectName: string
		count: number
	}>
	taskPerDays: Array<{
		date: string
		count: number
	}>
	spPerDay: Array<{
		date: string
		totalStoryPoints: number
	}>
}

export const dashboardService = {
	/**
	 * Get dashboard statistics
	 * @param userId - Current user ID
	 * @param startAt - Start date as unix timestamp (in seconds)
	 * @param endAt - End date as unix timestamp (in seconds)
	 * @param justForMe - If true, only show current user's tasks. If false, show team tasks
	 */
	async getStats(
		userId: number,
		startAt: number,
		endAt: number,
		justForMe: boolean = true
	): Promise<DashboardStatsResponse> {
		const response = await axios.get(`${API_BASE}/dashboard/stats`, {
			params: {
				startAt,
				endAt,
				justForMe
			},
			headers: {
				'X-User-Id': userId
			}
		})

		return response.data.data
	},

	/**
	 * Helper: Convert Date to unix timestamp (seconds)
	 */
	dateToUnix(date: Date): number {
		return Math.floor(date.getTime() / 1000)
	},

	/**
	 * Helper: Get current month range
	 */
	getCurrentMonthRange() {
		const now = new Date()
		const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
		const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

		return {
			startAt: this.dateToUnix(startDate),
			endAt: this.dateToUnix(endDate)
		}
	},

	/**
	 * Helper: Get current week range
	 */
	getCurrentWeekRange() {
		const now = new Date()
		const dayOfWeek = now.getDay()
		const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // adjust when day is Sunday

		const startDate = new Date(now.setDate(diff))
		startDate.setHours(0, 0, 0, 0)

		const endDate = new Date(startDate)
		endDate.setDate(endDate.getDate() + 6)
		endDate.setHours(23, 59, 59, 999)

		return {
			startAt: this.dateToUnix(startDate),
			endAt: this.dateToUnix(endDate)
		}
	},

	/**
	 * Helper: Get custom date range
	 */
	getDateRange(fromDate: Date, toDate: Date) {
		fromDate.setHours(0, 0, 0, 0)
		toDate.setHours(23, 59, 59, 999)

		return {
			startAt: this.dateToUnix(fromDate),
			endAt: this.dateToUnix(toDate)
		}
	}
}
```

### React Hook Component Example

```typescript
// useDashboard.ts
import { useState, useEffect } from 'react'
import { dashboardService } from './dashboardService'

export function useDashboard(userId: number, justForMe: boolean = true) {
	const [data, setData] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		fetchDashboard()
	}, [justForMe])

	const fetchDashboard = async (customRange?: { startAt: number; endAt: number }) => {
		try {
			setLoading(true)
			setError(null)

			const range = customRange || dashboardService.getCurrentMonthRange()
			const response = await dashboardService.getStats(userId, range.startAt, range.endAt, justForMe)

			setData(response)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
		} finally {
			setLoading(false)
		}
	}

	return {
		data,
		loading,
		error,
		refetch: fetchDashboard
	}
}
```

### Dashboard Component with Charts

```typescript
// Dashboard.tsx
import React, { useState } from 'react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useDashboard } from './useDashboard';
import { dashboardService } from './dashboardService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

interface Props {
  userId: number;
}

export function Dashboard({ userId }: Props) {
  const [justForMe, setJustForMe] = useState(true);
  const [dateRange, setDateRange] = useState<'month' | 'week' | 'custom'>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const { data, loading, error, refetch } = useDashboard(userId, justForMe);

  const handleDateRangeChange = (newRange: 'month' | 'week' | 'custom') => {
    setDateRange(newRange);

    let range;
    if (newRange === 'month') {
      range = dashboardService.getCurrentMonthRange();
    } else if (newRange === 'week') {
      range = dashboardService.getCurrentWeekRange();
    } else {
      if (!customStart || !customEnd) return;
      range = dashboardService.getDateRange(new Date(customStart), new Date(customEnd));
    }

    refetch(range);
  };

  if (loading) return <div className="p-4">Loading dashboard...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!data) return <div className="p-4">No data available</div>;

  return (
    <div className="p-6 bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow flex gap-4 items-center">
          <div>
            <label className="mr-2">Period:</label>
            <select
              value={dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value as any)}
              className="px-3 py-2 border rounded"
            >
              <option value="month">This Month</option>
              <option value="week">This Week</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-2 border rounded"
              />
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-2 border rounded"
              />
              <button
                onClick={() => handleDateRangeChange('custom')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply
              </button>
            </>
          )}

          <label className="ml-auto">
            <input
              type="checkbox"
              checked={justForMe}
              onChange={(e) => setJustForMe(e.target.checked)}
              className="mr-2"
            />
            Just My Tasks
          </label>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Tasks Assigned"
          value={data.stats.assignedTasks}
          icon="📋"
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Tasks Completed"
          value={data.stats.completedTasks}
          icon="✅"
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="Story Points"
          value={data.stats.totalStoryPoints.toFixed(1)}
          icon="⭐"
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pie Chart - Tasks per Project */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Tasks per Project</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.taskPerProjects}
                dataKey="count"
                nameKey="projectName"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ projectName, count }) => `${projectName} (${count})`}
              >
                {data.taskPerProjects.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* List - Tasks per Project */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Tasks by Project</h2>
          <div className="space-y-2">
            {data.taskPerProjects.map((item, index) => (
              <div key={item.projectId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium">{item.projectName}</span>
                </div>
                <span className="text-sm font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Line Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks per Day */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Tasks per Day</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.taskPerDays}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#0088FE"
                dot={{ fill: '#0088FE' }}
                name="Task Count"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Story Points per Day */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Story Points per Day</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.spPerDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalStoryPoints"
                stroke="#82CA9D"
                dot={{ fill: '#82CA9D' }}
                name="Story Points"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Helper Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className={`p-6 rounded-lg shadow ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}
```

## API Testing with cURL

### Test 1: Get current month stats for current user

```bash
# Get unix timestamps for this month
START_DATE=$(date -d "$(date +%Y-%m)-01" +%s)
END_DATE=$(date +%s)

curl -X GET "http://localhost:3000/api/dashboard/stats?startAt=${START_DATE}&endAt=${END_DATE}&justForMe=true" \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json"
```

### Test 2: Get team stats for a specific period

```bash
# Feb 14, 2024 to Mar 16, 2024
curl -X GET "http://localhost:3000/api/dashboard/stats?startAt=1707897600&endAt=1710576000&justForMe=false" \
  -H "X-User-Id: 1" \
  -H "Content-Type: application/json"
```

### Test 3: Get last 7 days stats

```bash
END_DATE=$(date +%s)
START_DATE=$((END_DATE - 7 * 24 * 60 * 60))

curl -X GET "http://localhost:3000/api/dashboard/stats?startAt=${START_DATE}&endAt=${END_DATE}" \
  -H "X-User-Id: 1"
```

## Integration Checklist

- [ ] Import `useDashboard` hook in your component
- [ ] Pass `userId` from auth context or props
- [ ] Handle `loading` and `error` states
- [ ] Render stats cards with metrics
- [ ] Render pie chart with `taskPerProjects` data
- [ ] Render line charts with `taskPerDays` and `spPerDay`
- [ ] Add date range selector for custom periods
- [ ] Add toggle for "Just My Tasks" vs "Team Tasks"
- [ ] Test with different date ranges
- [ ] Verify all charts render correctly

## Common Errors & Solutions

### Error: "Invalid user ID"

**Solution**: Ensure `X-User-Id` header is being sent and is a valid number

### Error: "startAt and endAt are required"

**Solution**: Check that both `startAt` and `endAt` query parameters are provided

### Error: "startAt must be less than endAt"

**Solution**: Verify that `startAt` timestamp is actually before `endAt`

### Empty data returned

**Solution**: Check that your date range includes tasks. Tasks are filtered by `createdAt` date.

## Performance Tips

1. **Limit Date Ranges**: Don't fetch data for very large date ranges (e.g., multiple years)
2. **Debounce Requests**: Debounce date range changes to avoid multiple simultaneous requests
3. **Cache Results**: Consider caching dashboard data for 5-10 minutes
4. **Lazy Load Charts**: Load charts after stats are displayed for better perceived performance

## Notes for Frontend Team

- All dates in response are formatted as `YYYY-MM-DD`
- Story points can be decimal values (e.g., 8.5)
- Task counts are always integers
- If there are no tasks on a given day, it will not appear in the `taskPerDays` or `spPerDay` arrays
- Projects are ordered by task count in descending order
- The `justForMe` parameter defaults to `true` if not specified
