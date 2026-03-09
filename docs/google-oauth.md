# Google OAuth Login - Frontend Integration Guide

## Tổng quan

Backend đã hỗ trợ đăng nhập bằng Google OAuth 2.0. Tài liệu này hướng dẫn frontend tích hợp tính năng này.

## Luồng hoạt động

```
User click "Login with Google"
        │
        ▼
Frontend gọi GET /api/auth/google
        │
        ▼
Backend trả về Google OAuth URL
        │
        ▼
Frontend redirect user tới Google OAuth URL
        │
        ▼
User đăng nhập & đồng ý trên Google
        │
        ▼
Google redirect về Backend: GET /api/auth/google/callback?code=...
        │
        ▼
Backend xử lý code → tạo/tìm user → tạo JWT
        │
        ▼
Backend redirect về Frontend:
  {FRONTEND_URL}/auth/google/callback?accessToken=...&refreshToken=...&userId=...
        │
        ▼
Frontend đọc query params → lưu token → chuyển trang
```

## API Endpoints

### 1. Lấy Google Auth URL

```
GET /api/auth/google
```

**Response:**

```json
{
	"message": "Google auth URL",
	"status": 200,
	"metadata": {
		"url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&response_type=code&scope=email+profile&access_type=offline&prompt=consent"
	}
}
```

### 2. Google Callback (Backend tự xử lý)

```
GET /api/auth/google/callback?code=...
```

> **Lưu ý:** Frontend KHÔNG gọi trực tiếp endpoint này. Google sẽ tự redirect user về đây sau khi đăng nhập thành công.

Sau khi xử lý xong, backend sẽ redirect user về frontend với URL:

```
{FRONTEND_URL}/auth/google/callback?accessToken=xxx&refreshToken=xxx&userId=123
```

## Hướng dẫn implement Frontend

### Bước 1: Thêm nút "Login with Google"

```tsx
const LoginPage = () => {
	const handleGoogleLogin = async () => {
		try {
			const response = await fetch('/api/auth/google')
			const data = await response.json()
			// Redirect user tới Google
			window.location.href = data.metadata.url
		} catch (error) {
			console.error('Failed to get Google auth URL:', error)
		}
	}

	return (
		<div>
			{/* Login form hiện tại */}
			<button onClick={handleGoogleLogin}>Login with Google</button>
		</div>
	)
}
```

### Bước 2: Tạo trang callback `/auth/google/callback`

Tạo một route mới để xử lý redirect từ backend:

```tsx
// pages/auth/google/callback.tsx (hoặc tương đương trong router của bạn)
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const GoogleCallback = () => {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()

	useEffect(() => {
		const accessToken = searchParams.get('accessToken')
		const refreshToken = searchParams.get('refreshToken')
		const userId = searchParams.get('userId')

		if (accessToken && refreshToken && userId) {
			// Lưu token vào localStorage hoặc state management
			localStorage.setItem('accessToken', accessToken)
			localStorage.setItem('refreshToken', refreshToken)
			localStorage.setItem('userId', userId)

			// Redirect tới trang chính
			navigate('/dashboard')
		} else {
			// Xử lý lỗi
			navigate('/login?error=google-login-failed')
		}
	}, [searchParams, navigate])

	return <div>Đang xử lý đăng nhập...</div>
}

export default GoogleCallback
```

### Bước 3: Thêm route

```tsx
// Trong router config
<Route path='/auth/google/callback' element={<GoogleCallback />} />
```

## Lưu ý quan trọng

### Token storage

Sau khi nhận token từ Google callback, lưu token giống hệt flow login thường:

| Header        | Giá trị                      |
| ------------- | ---------------------------- |
| `token`       | accessToken nhận từ callback |
| `x-client-id` | userId nhận từ callback      |

### User đăng nhập Google

- Không cần verify email (đã verified tự động)
- Không có password (field `password` = null)
- Field `authProvider` = `"google"`
- Avatar được lấy tự động từ Google profile

### Xử lý lỗi

Nếu quá trình đăng nhập Google thất bại, backend sẽ không redirect về frontend mà trả về lỗi JSON. Frontend nên có timeout hoặc error handling khi user không quay về trang callback sau một khoảng thời gian.

### Với user đã đăng ký bằng email

- Nếu user đã đăng ký bằng email/password rồi login bằng Google → vẫn login thành công bằng account cũ
- Avatar sẽ được cập nhật từ Google nếu chưa có

## Biến môi trường Backend

Đảm bảo các biến sau được cấu hình đúng:

```env
GG_OAUTH_CLIENT_ID=<Google OAuth Client ID>
GG_OAUTH_CLIENT_SECRET=<Google OAuth Client Secret>
GG_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

> **Trên Google Cloud Console**, cần thêm `GG_OAUTH_REDIRECT_URI` vào danh sách **Authorized redirect URIs** của OAuth 2.0 Client.
