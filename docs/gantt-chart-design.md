# Gantt Chart & Project Schedule - Feature Design

## 1. Tổng quan

Tính năng Gantt Chart cho phép quản lý **lịch trình (Schedule)** trong dự án. Mỗi project có nhiều schedule (phase/sprint/giai đoạn), mỗi schedule chứa nhiều task. Quan hệ 1:N giữa Project → Task vẫn giữ nguyên, schedule đóng vai trò **nhóm/giai đoạn** để render Gantt chart theo cấu trúc phân tầng.

### Mô hình quan hệ

```
Project ──1:N──▶ Schedule (lịch trình / giai đoạn)
    │                  │
    │                  └──1:N──▶ Task (qua scheduleId)
    │
    └──────1:N────────────────▶ Task (projectId - GIỮ NGUYÊN)
```

- Một task **luôn thuộc 1 project** (qua `projectId` - quan hệ cũ, không đổi)
- Một task **có thể thuộc 1 schedule** (qua `scheduleId` - mới) hoặc không (unscheduled)
- Schedule bắt buộc thuộc 1 project

### Mục tiêu

- Hiển thị timeline theo cấu trúc: Schedule (group) → Tasks (bars)
- Quản lý dependencies giữa các task (trong cùng hoặc khác schedule)
- Drag & drop thay đổi thời gian task, auto-cascade
- Milestone markers trên timeline
- Critical path highlighting

---

## 2. Database Design

### 2.1. Bảng mới: `schedule` (Lịch trình)

Đại diện cho một giai đoạn/phase/sprint trong dự án.

```sql
CREATE TABLE schedule (
  "id"          SERIAL       PRIMARY KEY,
  "name"        VARCHAR(200) NOT NULL,
  "description" TEXT,
  "startDate"   INT          NOT NULL,    -- Unix timestamp
  "endDate"     INT          NOT NULL,    -- Unix timestamp
  "status"      VARCHAR(20)  NOT NULL DEFAULT 'PLANNED',
  "color"       VARCHAR(7)   DEFAULT '#6366f1',
  "projectId"   INT          NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  "sortOrder"   INT          DEFAULT 0,
  "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "deletedAt"   TIMESTAMPTZ,

  CONSTRAINT chk_schedule_dates CHECK ("startDate" <= "endDate")
);

CREATE INDEX idx_schedule_project ON schedule("projectId");
```

| Column      | Type         | Mô tả                                              |
| ----------- | ------------ | -------------------------------------------------- |
| id          | serial       | PK                                                 |
| name        | varchar(200) | Tên schedule ("Sprint 1", "Phase 2 - Design", ...) |
| description | text         | Mô tả chi tiết                                     |
| startDate   | int          | Ngày bắt đầu giai đoạn (unix timestamp)            |
| endDate     | int          | Ngày kết thúc giai đoạn (unix timestamp)           |
| status      | varchar(20)  | `PLANNED` / `ACTIVE` / `COMPLETED` / `ON_HOLD`     |
| color       | varchar(7)   | Màu hiển thị group bar trên Gantt                  |
| projectId   | int          | FK → project (CASCADE delete)                      |
| sortOrder   | int          | Thứ tự hiển thị trên Gantt (top → bottom)          |

### 2.2. Thay đổi bảng `task` (ALTER)

Thêm fields cần cho Gantt + liên kết schedule:

```sql
ALTER TABLE tasks
  ADD COLUMN "startDate"    INT  NULL,          -- Unix timestamp
  ADD COLUMN "duration"     INT  NULL,          -- Số working days
  ADD COLUMN "sortOrder"    INT  DEFAULT 0,     -- Thứ tự trong schedule/gantt
  ADD COLUMN "scheduleId"   INT  NULL REFERENCES schedule(id) ON DELETE SET NULL;

CREATE INDEX idx_task_schedule ON tasks("scheduleId");
```

| Column     | Type | Mô tả                                         |
| ---------- | ---- | --------------------------------------------- |
| startDate  | int  | Ngày bắt đầu task (unix timestamp)            |
| duration   | int  | Số working days (tính từ startDate → dueDate) |
| sortOrder  | int  | Thứ tự hiển thị trong schedule                |
| scheduleId | int  | FK → schedule (SET NULL khi xóa schedule)     |

> **Lưu ý:** `projectId` vẫn giữ nguyên. Task thuộc project trực tiếp, `scheduleId` chỉ là cách nhóm task vào giai đoạn.

### 2.3. Bảng mới: `task_dependency`

Quan hệ phụ thuộc giữa 2 task (predecessor → successor).

```sql
CREATE TABLE task_dependency (
  "id"              SERIAL       PRIMARY KEY,
  "predecessorId"   INT          NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  "successorId"     INT          NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  "type"            VARCHAR(5)   NOT NULL DEFAULT 'FS',
  "lagDays"         INT          NOT NULL DEFAULT 0,
  "createdAt"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_dependency   UNIQUE ("predecessorId", "successorId"),
  CONSTRAINT chk_no_self_dep CHECK ("predecessorId" != "successorId")
);

CREATE INDEX idx_dep_predecessor ON task_dependency("predecessorId");
CREATE INDEX idx_dep_successor   ON task_dependency("successorId");
```

| Column        | Type       | Mô tả                                 |
| ------------- | ---------- | ------------------------------------- |
| predecessorId | int        | Task phải xong trước                  |
| successorId   | int        | Task phụ thuộc                        |
| type          | varchar(5) | `FS` (Finish-Start), `FF`, `SS`, `SF` |
| lagDays       | int        | Delay days (âm = lead time)           |

### 2.4. Bảng mới: `milestone`

Mốc quan trọng gắn với schedule hoặc project.

```sql
CREATE TABLE milestone (
  "id"          SERIAL       PRIMARY KEY,
  "name"        VARCHAR(200) NOT NULL,
  "description" TEXT,
  "dueDate"     INT          NOT NULL,
  "status"      VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
  "color"       VARCHAR(7)   DEFAULT '#f59e0b',
  "projectId"   INT          NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  "scheduleId"  INT          NULL REFERENCES schedule(id) ON DELETE SET NULL,
  "sortOrder"   INT          DEFAULT 0,
  "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "deletedAt"   TIMESTAMPTZ
);

CREATE INDEX idx_milestone_project  ON milestone("projectId");
CREATE INDEX idx_milestone_schedule ON milestone("scheduleId");
```

### 2.5. ERD Diagram

```
┌──────────────┐
│   project    │
├──────────────┤
│ id (PK)      │──────────────────────────────────────────────┐
│ name         │──────────┐                                   │
│ startDate    │          │                                   │
│ endDate      │          │                                   │
│ teamId (FK)  │          │                                   │
│ ...          │          │                                   │
└──────────────┘          │                                   │
                          │ 1:N                               │ 1:N (GIỮ NGUYÊN)
                          ▼                                   │
                 ┌─────────────────┐                          │
                 │    schedule     │                          │
                 ├─────────────────┤                          │
                 │ id (PK)         │──────┐                   │
                 │ name            │      │                   │
                 │ startDate       │      │                   │
                 │ endDate         │      │ 1:N               │
                 │ status          │      │                   │
                 │ color           │      │                   │
                 │ projectId (FK)  │      │                   │
                 │ sortOrder       │      │                   │
                 └─────────────────┘      │                   │
                          │               │                   │
                          │ 1:N           │                   │
                          ▼               │                   │
                 ┌─────────────────┐      │                   │
                 │   milestone     │      │                   │
                 ├─────────────────┤      │                   │
                 │ id (PK)         │      │                   │
                 │ name            │      │                   │
                 │ dueDate         │      │                   │
                 │ projectId (FK)  │◀─────┼───────────────────┘
                 │ scheduleId (FK) │◀─────┘
                 └─────────────────┘

                 ┌───────────────────────┐
                 │        tasks          │
                 ├───────────────────────┤
                 │ id (PK)               │
                 │ title                 │
                 │ startDate       ★ NEW │
                 │ dueDate               │
                 │ duration        ★ NEW │
                 │ sortOrder       ★ NEW │
                 │ projectId (FK)        │◀── GIỮ NGUYÊN (1:N từ project)
                 │ scheduleId (FK) ★ NEW │◀── MỚI (nhóm vào schedule)
                 │ assigneeId (FK)       │
                 │ status                │
                 │ priority              │
                 │ completedPercent      │
                 │ ...                   │
                 └───────────┬───────────┘
                             │
                    ┌────────┴────────┐
              predecessorId     successorId
                    │                 │
               ┌────┴─────────────────┴────┐
               │     task_dependency       │
               ├───────────────────────────┤
               │ id (PK)                   │
               │ predecessorId (FK → task) │
               │ successorId   (FK → task) │
               │ type (FS/FF/SS/SF)        │
               │ lagDays                   │
               └───────────────────────────┘
```

---

## 3. Enums mới

```typescript
// src/model/enums/gantt.enum.ts

export enum ScheduleStatus {
	PLANNED = 'PLANNED',
	ACTIVE = 'ACTIVE',
	COMPLETED = 'COMPLETED',
	ON_HOLD = 'ON_HOLD'
}

export enum DependencyType {
	FS = 'FS', // Finish-to-Start (phổ biến nhất)
	FF = 'FF', // Finish-to-Finish
	SS = 'SS', // Start-to-Start
	SF = 'SF' // Start-to-Finish
}

export enum MilestoneStatus {
	PENDING = 'PENDING',
	IN_PROGRESS = 'IN_PROGRESS',
	COMPLETED = 'COMPLETED'
}
```

---

## 4. TypeScript Interfaces (Frontend-ready)

### 4.1. Core Interfaces

```typescript
// src/types/gantt.type.ts

/** ─── Schedule (Lịch trình) ─── */
interface ScheduleDto {
	id: number
	name: string
	description?: string
	startDate: number // unix timestamp
	endDate: number // unix timestamp
	status: ScheduleStatus
	color: string
	projectId: number
	sortOrder: number
	// Computed fields (server tính)
	progress: number // 0-100, trung bình completedPercent của tasks
	taskCount: number
	completedTaskCount: number
}

/** ─── Gantt Task (Task đã enrich cho Gantt) ─── */
interface GanttTaskDto {
	id: number
	title: string
	startDate: number | null
	dueDate: number | null
	duration: number | null // working days
	status: TaskStatus
	type: TaskType
	priority: TaskPriority | null
	completedPercent: number
	sortOrder: number

	// Relations
	scheduleId: number | null
	projectId: number
	assignee: { id: number; name: string; avatarUrl?: string } | null
	reviewer: { id: number; name: string } | null

	// Dependencies (inline cho tiện render)
	predecessors: DependencyLink[]
	successors: DependencyLink[]
}

interface DependencyLink {
	dependencyId: number // PK của task_dependency
	taskId: number // predecessor hoặc successor task ID
	type: DependencyType
	lagDays: number
}

/** ─── Milestone ─── */
interface MilestoneDto {
	id: number
	name: string
	description?: string
	dueDate: number
	status: MilestoneStatus
	color: string
	projectId: number
	scheduleId: number | null
	sortOrder: number
}

/** ─── Dependency Record ─── */
interface TaskDependencyDto {
	id: number
	predecessorId: number
	successorId: number
	type: DependencyType
	lagDays: number
}
```

### 4.2. Gantt API Response (Main endpoint)

```typescript
/** GET /project/:projectId/gantt — Response */
interface GanttResponse {
	project: {
		id: number
		name: string
		startDate: string | null
		endDate: string | null
		status: ProjectStatus
	}

	// Schedules chứa tasks con → render dạng collapsible groups
	schedules: GanttScheduleGroup[]

	// Tasks không thuộc schedule nào → render riêng section "Unscheduled"
	unscheduledTasks: GanttTaskDto[]

	// Tất cả milestones trong project
	milestones: MilestoneDto[]

	// Flat list tất cả dependencies → vẽ arrows
	dependencies: TaskDependencyDto[]

	// Summary
	summary: {
		totalTasks: number
		completedTasks: number
		overallProgress: number // 0-100
		criticalPath: number[] // task IDs trên critical path
		dateRange: {
			// min/max dates để set viewport
			earliest: number
			latest: number
		}
	}
}

/** Schedule group: schedule + tasks bên trong */
interface GanttScheduleGroup {
	schedule: ScheduleDto
	tasks: GanttTaskDto[] // tasks thuộc schedule, sorted by sortOrder
}
```

### 4.3. Cách Frontend render từ `GanttResponse`

```
Gantt Chart Layout (từ response):
═══════════════════════════════════════════════════════════════════
ROW#  LEFT PANEL (task list)       TIMELINE (bars)
═══════════════════════════════════════════════════════════════════
      ▾ Sprint 1 (schedule)        ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ← schedule bar (startDate → endDate)
 1      ├─ Design UI               ████████░░░░  (60%)
 2      ├─ Setup API               ████████████  (100%) ✓
 3      └─ Write tests                  ▶═══════════
      ◆ MVP Release                          ◆            ← milestone diamond

      ▾ Sprint 2 (schedule)            ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ← schedule bar
 4      ├─ Implement auth               ▶████░░░░░░
 5      ├─ Payment integration              ▶═══════════
 6      └─ Deploy staging                        ▶════

      Unscheduled
 7      ├─ Tech debt cleanup        ░░░░░░░░
 8      └─ Update docs              ░░░░
═══════════════════════════════════════════════════════════════════
                                   Mar     Apr     May     Jun

Logic render:
1. Loop qua response.schedules[] → mỗi schedule = 1 group row + N task rows
2. Append response.unscheduledTasks[] → section cuối
3. Draw response.dependencies[] → arrows nối giữa task bars
4. Draw response.milestones[] → diamond markers theo dueDate
5. Highlight response.summary.criticalPath[] → viền đỏ cho task bars
6. Viewport: summary.dateRange.earliest → summary.dateRange.latest
```

---

## 5. API Endpoints

### 5.1. Schedule CRUD

| Method | Path                                    | Mô tả                      |
| ------ | --------------------------------------- | -------------------------- |
| GET    | `/project/:projectId/schedules`         | List schedules của project |
| POST   | `/project/:projectId/schedules`         | Tạo schedule mới           |
| PATCH  | `/project/:projectId/schedules/:id`     | Cập nhật schedule          |
| DELETE | `/project/:projectId/schedules/:id`     | Xóa schedule               |
| PATCH  | `/project/:projectId/schedules/reorder` | Reorder schedules          |

#### `POST /project/:projectId/schedules`

```json
// Request
{
  "name": "Sprint 1 - Foundation",
  "description": "Setup cơ bản, auth, DB",
  "startDate": 1741564800,
  "endDate": 1743465600,
  "color": "#6366f1"
}

// Response 201
{
  "id": 1,
  "name": "Sprint 1 - Foundation",
  "description": "Setup cơ bản, auth, DB",
  "startDate": 1741564800,
  "endDate": 1743465600,
  "status": "PLANNED",
  "color": "#6366f1",
  "projectId": 5,
  "sortOrder": 0,
  "progress": 0,
  "taskCount": 0,
  "completedTaskCount": 0
}
```

#### `PATCH /project/:projectId/schedules/:id`

```json
// Request — update trực tiếp schedule, gồm cả status
{
  "name": "Sprint 1 - Delivery",
  "status": "ON_HOLD",
  "color": "#ef4444"
}

// Response 200
{
  "id": 1,
  "name": "Sprint 1 - Delivery",
  "description": "Setup cơ bản, auth, DB",
  "startDate": 1741564800,
  "endDate": 1743465600,
  "status": "ON_HOLD",
  "color": "#ef4444",
  "projectId": 5,
  "sortOrder": 0
}
```

**Rule hiện tại của backend cho `schedule.status`:**

1. Tạo mới schedule luôn có status mặc định là `PLANNED`.
2. FE có thể đổi status trực tiếp bằng `PATCH /project/:projectId/schedules/:id` với field `status`.
3. Nếu schedule đang là `PLANNED` và có ít nhất 1 task trong schedule chuyển sang status khác `PENDING`, backend sẽ tự đổi schedule sang `ACTIVE`.
4. Auto-update chỉ đẩy `PLANNED -> ACTIVE`, không tự ghi đè các status thủ công như `ON_HOLD` hoặc `COMPLETED`.

#### `PATCH /project/:projectId/schedules/reorder`

```json
// Request — thay đổi thứ tự schedules
{
	"orders": [
		{ "id": 2, "sortOrder": 0 },
		{ "id": 1, "sortOrder": 1 },
		{ "id": 3, "sortOrder": 2 }
	]
}
```

### 5.2. Gantt (Main Endpoint)

| Method | Path                                 | Mô tả                                     |
| ------ | ------------------------------------ | ----------------------------------------- |
| GET    | `/project/:projectId/gantt`          | Lấy toàn bộ data render Gantt             |
| PATCH  | `/project/:projectId/gantt/schedule` | Bulk update dates (drag & drop + cascade) |

#### `GET /project/:projectId/gantt`

**Query params:**

| Param      | Type   | Mô tả                           |
| ---------- | ------ | ------------------------------- |
| startDate  | int    | Filter từ ngày (unix timestamp) |
| endDate    | int    | Filter đến ngày                 |
| assigneeId | int    | Filter theo assignee            |
| status     | string | Filter theo task status (multi) |
| scheduleId | int    | Filter theo schedule cụ thể     |

**Response: `GanttResponse`** (xem Section 4.2)

#### `PATCH /project/:projectId/gantt/schedule`

Drag & drop: di chuyển task hoặc schedule trên timeline.

```json
// Request
{
  "taskUpdates": [
    { "taskId": 101, "startDate": 1741564800, "dueDate": 1742169600 },
    { "taskId": 102, "startDate": 1742256000, "dueDate": 1743465600 }
  ],
  "scheduleUpdates": [
    { "scheduleId": 1, "startDate": 1741564800, "endDate": 1743465600 }
  ],
  "autoSchedule": true    // tự động cascade dependencies
}

// Response
{
  "updatedTasks": [
    { "id": 101, "startDate": 1741564800, "dueDate": 1742169600 },
    { "id": 102, "startDate": 1742256000, "dueDate": 1743465600 },
    { "id": 104, "startDate": 1743552000, "dueDate": 1744156800 }  // cascaded
  ],
  "updatedSchedules": [
    { "id": 1, "startDate": 1741564800, "endDate": 1743465600 }
  ]
}
```

### 5.3. Task ↔ Schedule Assignment

| Method | Path                                                  | Mô tả                                                                  |
| ------ | ----------------------------------------------------- | ---------------------------------------------------------------------- |
| PATCH  | `/task/:taskId`                                       | Update task (dùng API cũ, thêm `scheduleId`, `startDate`, `sortOrder`) |
| PATCH  | `/project/:projectId/schedules/:id/tasks/reorder`     | Reorder tasks trong schedule                                           |
| POST   | `/project/:projectId/schedules/:id/tasks/bulk-assign` | Gán nhiều tasks vào schedule                                           |

#### `POST /project/:projectId/schedules/:scheduleId/tasks/bulk-assign`

```json
// Request — gán 3 task vào schedule
{
  "taskIds": [101, 102, 103]
}

// Response 200
{
  "assignedCount": 3,
  "tasks": [
    { "id": 101, "scheduleId": 1 },
    { "id": 102, "scheduleId": 1 },
    { "id": 103, "scheduleId": 1 }
  ]
}
```

### 5.4. Task Dependencies

| Method | Path                                | Mô tả             |
| ------ | ----------------------------------- | ----------------- |
| GET    | `/task/:taskId/dependencies`        | Lấy deps của task |
| POST   | `/task/:taskId/dependencies`        | Thêm dependency   |
| DELETE | `/task/:taskId/dependencies/:depId` | Xóa dependency    |

#### `POST /task/:taskId/dependencies`

```json
// Request — Task 102 phụ thuộc vào Task 101
// URL: POST /task/102/dependencies
{
  "predecessorId": 101,
  "type": "FS",
  "lagDays": 0
}

// Response 201
{
  "id": 1,
  "predecessorId": 101,
  "successorId": 102,
  "type": "FS",
  "lagDays": 0
}
```

**Validations:**

- `predecessorId` ≠ `:taskId` (không tự phụ thuộc)
- Cả 2 task phải cùng `projectId`
- Không circular dependency (DFS detect)
- Không duplicate (unique constraint)

### 5.5. Milestones

| Method | Path                                 | Mô tả           |
| ------ | ------------------------------------ | --------------- |
| GET    | `/project/:projectId/milestones`     | List milestones |
| POST   | `/project/:projectId/milestones`     | Tạo milestone   |
| PATCH  | `/project/:projectId/milestones/:id` | Cập nhật        |
| DELETE | `/project/:projectId/milestones/:id` | Xóa             |

---

## 6. Luồng xử lý chính (Flow Diagrams)

### 6.1. Load Gantt Chart

```
Client                              Server
  │                                    │
  │ GET /project/5/gantt               │
  │───────────────────────────────────▶│
  │                                    │
  │                                    ├─ Query project(5)
  │                                    ├─ Query schedules WHERE projectId=5 ORDER BY sortOrder
  │                                    ├─ Query tasks WHERE projectId=5
  │                                    │   JOIN assignee, reviewer
  │                                    │   ORDER BY scheduleId, sortOrder
  │                                    ├─ Query dependencies WHERE task.projectId=5
  │                                    ├─ Query milestones WHERE projectId=5
  │                                    ├─ Group tasks by scheduleId:
  │                                    │   ├─ scheduleId != null → vào schedule group
  │                                    │   └─ scheduleId == null → unscheduledTasks
  │                                    ├─ Compute per-schedule progress
  │                                    ├─ Compute summary + critical path
  │                                    │
  │  ◀────────────────────────────────│
  │  GanttResponse {                   │
  │    schedules: [                    │
  │      { schedule, tasks[] },        │
  │      { schedule, tasks[] }         │
  │    ],                              │
  │    unscheduledTasks: [...],        │
  │    milestones: [...],              │
  │    dependencies: [...],            │
  │    summary: { criticalPath, ... }  │
  │  }                                 │
  │                                    │
  ▼  Render Gantt                      ▼
```

### 6.2. Tạo Schedule + Gán Tasks

```
Client                              Server
  │                                    │
  │ ① POST /project/5/schedules       │
  │  { name: "Sprint 1", ... }        │
  │───────────────────────────────────▶│
  │                                    │── Create schedule record
  │  ◀─ 201 { id: 1, ... }            │
  │                                    │
  │ ② POST /project/5/schedules/1/    │
  │   tasks/bulk-assign               │
  │  { taskIds: [101, 102, 103] }     │
  │───────────────────────────────────▶│
  │                                    │── UPDATE tasks SET scheduleId=1
  │                                    │   WHERE id IN (101,102,103)
  │                                    │   AND projectId=5
  │  ◀─ 200 { assignedCount: 3 }      │
  │                                    │
  │ ③ GET /project/5/gantt            │
  │───────────────────────────────────▶│
  │  ◀─ GanttResponse (tasks grouped) │
  │                                    │
  ▼  Tasks xuất hiện trong Sprint 1   ▼
```

### 6.3. FE Implement: Schedule Status

FE nên coi `schedule.status` là dữ liệu từ server, không tự suy luận cứng ở client. Có 2 luồng cập nhật cần hỗ trợ song song:

1. **Manual update**: user đổi status trực tiếp từ UI.
2. **Implicit update**: khi task trong schedule rời khỏi `PENDING`, backend có thể tự đẩy schedule sang `ACTIVE`.

#### A. Manual status change từ FE

Khi user chọn status mới trong dropdown hoặc context menu, gọi:

```ts
await api.patch(`/project/${projectId}/schedules/${scheduleId}`, {
	status: 'ON_HOLD'
})
```

Khuyến nghị UI:

1. Disable nút trong lúc request đang pending.
2. Sau khi request thành công, cập nhật local state bằng response từ server.
3. Nếu đang dùng cache như React Query/SWR, invalidate `GET /project/:projectId/gantt` hoặc `GET /project/:projectId/schedules`.

#### B. Implicit status change khi task đổi trạng thái

Các action FE có thể kích hoạt rule ngầm này:

1. `PATCH /task/:id` với payload có `status` khác `PENDING`
2. `POST /task/:id/submit-qc`
3. `POST /task/:id/qc-review`
4. `POST /project/:projectId/schedules/:id/tasks/bulk-assign` nếu task được gán vào schedule đã ở status khác `PENDING`

Ví dụ update task sang processing:

```ts
await api.patch(`/task/${taskId}`, {
	status: 'PROCESSING'
})
```

Sau các action trên, FE nên refresh lại schedule source-of-truth từ server vì response của task API không đảm bảo trả kèm schedule mới nhất.

Khuyến nghị đơn giản nhất:

```ts
await api.patch(`/task/${taskId}`, { status: 'PROCESSING' })
await queryClient.invalidateQueries({ queryKey: ['gantt', projectId] })
await queryClient.invalidateQueries({ queryKey: ['schedules', projectId] })
```

#### C. Rule hiển thị ở UI

1. Badge schedule hiển thị đúng 4 trạng thái: `PLANNED`, `ACTIVE`, `COMPLETED`, `ON_HOLD`.
2. Không tự local-compute kiểu `if any task processing => ACTIVE` nếu chưa sync server, vì sẽ dễ lệch với trạng thái thủ công.
3. Khi user vừa đổi status thủ công sang `ON_HOLD` hoặc `COMPLETED`, FE luôn ưu tiên render response trả về từ `PATCH /schedules/:id`.
4. Sau khi task update xong, nếu fetch lại thấy schedule vẫn là `PLANNED`, FE không nên tự sửa vì backend đã là nguồn quyết định cuối cùng.

### 6.4. Drag & Drop Task (Auto-cascade)

```
Client                              Server
  │                                    │
  │ User kéo Task 101 sang phải 3 ngày│
  │                                    │
  │ PATCH /project/5/gantt/schedule    │
  │ {                                  │
  │   taskUpdates: [{                  │
  │     taskId: 101,                   │
  │     startDate: 1741824000,         │
  │     dueDate: 1742428800            │
  │   }],                              │
  │   autoSchedule: true               │
  │ }                                  │
  │───────────────────────────────────▶│
  │                                    │── Save Task 101 new dates
  │                                    │── autoSchedule=true → cascade:
  │                                    │   ├─ 101 has successor 102 (FS, lag=0)
  │                                    │   │  ├─ 102.startDate = 101.dueDate + 1day
  │                                    │   │  └─ 102.dueDate += delta
  │                                    │   │     └─ 102 has successor 104 (FS)
  │                                    │   │        └─ cascade tiếp...
  │                                    │   └─ 101 has successor 103 (SS, lag=0)
  │                                    │      └─ 103.startDate = 101.startDate
  │                                    │── Return all affected tasks
  │  ◀────────────────────────────────│
  │  { updatedTasks: [101,102,103,104]}│
  │                                    │
  ▼  Re-render 4 task bars + arrows    ▼
```

### 6.5. Add Dependency (Draw Arrow)

```
Client                              Server
  │                                    │
  │ User kéo arrow từ Task 101 → 102  │
  │                                    │
  │ POST /task/102/dependencies        │
  │ { predecessorId: 101,              │
  │   type: "FS", lagDays: 0 }        │
  │───────────────────────────────────▶│
  │                                    │── Check: 101.projectId == 102.projectId? ✓
  │                                    │── Check: circular? DFS from 101 → ... → 102? ✗ OK
  │                                    │── INSERT task_dependency
  │                                    │── Auto-adjust 102.startDate nếu cần
  │  ◀────────────────────────────────│
  │  201 { dependency, updatedTasks }  │
  │                                    │
  ▼  Draw arrow + update bar pos       ▼
```

### 6.5. Critical Path Calculation

```
Algorithm: Longest Path in DAG (topological sort)

1. Build dependency graph từ task_dependency
2. Topological sort các tasks
3. Forward pass: tính Early Start (ES) & Early Finish (EF)
   - ES = max(EF of all predecessors + lagDays)
   - EF = ES + duration
4. Backward pass: tính Late Start (LS) & Late Finish (LF)
   - LF = min(LS of all successors - lagDays)
   - LS = LF - duration
5. Float = LS - ES (hoặc LF - EF)
6. Critical path = tasks WHERE float == 0

Kết quả: Array<taskId> trên critical path → highlight đỏ trên Gantt
```

---

## 7. Service Layer

### 7.1. `ScheduleService`

```typescript
class ScheduleService {
	getByProject(projectId: number): Promise<Schedule[]>
	create(projectId: number, data: CreateScheduleDto): Promise<Schedule>
	update(id: number, data: UpdateScheduleDto): Promise<Schedule>
	delete(id: number): Promise<boolean>
	reorder(projectId: number, orders: { id: number; sortOrder: number }[]): Promise<void>

	// Tự động cập nhật schedule status dựa theo tasks bên trong
	syncStatus(scheduleId: number): Promise<ScheduleStatus>

	// Gán tasks vào schedule
	bulkAssignTasks(scheduleId: number, taskIds: number[], projectId: number): Promise<Task[]>
}
```

### 7.2. `GanttService`

```typescript
class GanttService {
	// Main endpoint: lấy toàn bộ data cho Gantt view
	getGanttData(projectId: number, filters?: GanttFilters): Promise<GanttResponse>

	// Bulk update từ drag & drop, auto-cascade dependencies
	updateSchedule(
		projectId: number,
		taskUpdates: TaskScheduleUpdate[],
		scheduleUpdates: ScheduleDateUpdate[],
		autoSchedule: boolean
	): Promise<{ updatedTasks: Task[]; updatedSchedules: Schedule[] }>

	// Critical path: topological sort + forward/backward pass
	calculateCriticalPath(projectId: number): Promise<number[]>
}
```

### 7.3. `TaskDependencyService`

```typescript
class TaskDependencyService {
	getDependencies(taskId: number): Promise<{
		predecessors: TaskDependency[]
		successors: TaskDependency[]
	}>

	addDependency(successorId: number, data: CreateDependencyDto): Promise<TaskDependency>
	removeDependency(depId: number): Promise<boolean>

	// Detect circular dependency (DFS)
	private detectCircular(predecessorId: number, successorId: number): Promise<boolean>

	// Cascade reschedule từ 1 task thay đổi
	cascadeSchedule(taskId: number, visited?: Set<number>): Promise<UpdatedTask[]>
}
```

### 7.4. `MilestoneService`

```typescript
class MilestoneService {
	getByProject(projectId: number): Promise<Milestone[]>
	create(projectId: number, data: CreateMilestoneDto): Promise<Milestone>
	update(id: number, data: UpdateMilestoneDto): Promise<Milestone>
	delete(id: number): Promise<boolean>
}
```

---

## 8. Auto-Schedule Algorithm

```
function cascadeSchedule(changedTaskId, visited = new Set()):
  if visited.has(changedTaskId): return []
  visited.add(changedTaskId)

  task = getTask(changedTaskId)
  deps = getSuccessorDeps(changedTaskId)
  result = []

  for dep in deps:
    successor = getTask(dep.successorId)
    newStart = calculateNewStart(task, successor, dep)

    if newStart > successor.startDate:     // chỉ đẩy lùi, không kéo sớm
      delta = newStart - successor.startDate
      successor.startDate = newStart
      successor.dueDate += delta
      save(successor)
      result.push(successor)
      result.push(...cascadeSchedule(successor.id, visited))

  return result

function calculateNewStart(pred, succ, dep):
  DAY = 86400
  switch dep.type:
    case 'FS': return pred.dueDate + (1 + dep.lagDays) * DAY
    case 'SS': return pred.startDate + dep.lagDays * DAY
    case 'FF': return pred.dueDate + dep.lagDays * DAY - succ.duration * DAY
    case 'SF': return pred.startDate + dep.lagDays * DAY - succ.duration * DAY
```

---

## 9. File Structure (Backend - New & Modified)

```
src/
├── model/
│   ├── schedule.entity.ts            ★ NEW
│   ├── task-dependency.entity.ts     ★ NEW
│   ├── milestone.entity.ts           ★ NEW
│   ├── task.entity.ts                ✏️ EDIT (thêm startDate, duration, sortOrder, scheduleId)
│   └── enums/
│       └── gantt.enum.ts             ★ NEW
├── repository/
│   ├── schedule.repository.ts        ★ NEW
│   ├── task-dependency.repository.ts ★ NEW
│   └── milestone.repository.ts       ★ NEW
├── services/
│   ├── schedule.service.ts           ★ NEW
│   ├── gantt.service.ts              ★ NEW
│   ├── task-dependency.service.ts    ★ NEW
│   └── milestone.service.ts          ★ NEW
├── controllers/
│   ├── schedule.controller.ts        ★ NEW
│   ├── gantt.controller.ts           ★ NEW
│   └── milestone.controller.ts       ★ NEW
├── routes/
│   ├── schedule.route.ts             ★ NEW
│   ├── gantt.route.ts                ★ NEW
│   └── milestone.route.ts            ★ NEW
├── types/
│   └── gantt.type.ts                 ★ NEW
├── db/
│   └── data-source.ts                ✏️ EDIT (register new entities)
└── routes/
    └── index.ts                      ✏️ EDIT (register new routes)
```

---

## 10. Validation Rules

| Rule                                         | Endpoint                | Code |
| -------------------------------------------- | ----------------------- | ---- |
| schedule.startDate ≤ schedule.endDate        | Schedule create/update  | 400  |
| task.startDate ≤ task.dueDate                | Task update             | 400  |
| task.projectId == schedule.projectId         | Assign task to schedule | 400  |
| predecessor.projectId == successor.projectId | Add dependency          | 400  |
| No circular dependency                       | Add dependency          | 409  |
| No duplicate dependency                      | Add dependency          | 409  |
| predecessorId ≠ successorId                  | Add dependency          | 400  |
| lagDays ∈ [-365, 365]                        | Add dependency          | 400  |
| type ∈ {FS, FF, SS, SF}                      | Add dependency          | 400  |

---

## 11. Implementation Phases

### Phase 1: Core (MVP)

1. Tạo entities: `Schedule`, `TaskDependency`, `Milestone`
2. ALTER `Task` entity: thêm `startDate`, `duration`, `sortOrder`, `scheduleId`
3. Schedule CRUD service + controller + routes
4. `GET /project/:projectId/gantt` endpoint (main data)
5. Basic Gantt rendering

### Phase 2: Dependencies & Scheduling

6. Dependency CRUD + circular detection
7. Drag & drop → `PATCH /gantt/schedule`
8. Auto-cascade algorithm
9. Milestone CRUD

### Phase 3: Advanced

10. Critical path calculation
11. Zoom levels (day/week/month/quarter)
12. Schedule auto-status sync
13. Export Gantt (image/PDF)

---

## 12. Performance Considerations

- **Indexes:** `schedule.projectId`, `tasks.scheduleId`, `tasks.projectId`, `task_dependency.predecessorId/successorId`, `milestone.projectId`
- **Single request:** `GET /gantt` trả về ALL data trong 1 call (không N+1)
- **Batch writes:** Cascade update trong 1 transaction
- **Cascade depth limit:** Max 100 levels để tránh infinite loop
- **Computed fields:** `progress`, `taskCount` tính ở application layer, không store
