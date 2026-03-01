import cron from 'node-cron'
import axios from 'axios'

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000/ai'

/**
 * Sync tasks from backend to AI service vector store
 * Calls POST /ai/sync/tasks-from-backend
 */
async function syncTasksToAI() {
	console.log(`[${new Date().toISOString()}] 🔄 Starting sync tasks to AI service...`)

	try {
		const response = await axios.post(`${AI_SERVICE_URL}/sync/tasks-from-backend`, null, {
			params: {
				page_limit: 100,
				max_pages: null, // sync all
				force: true
			},
			timeout: 300000 // 5 minutes timeout for large sync
		})

		const { total, success, failed, errors } = response.data
		console.log(`[${new Date().toISOString()}] ✅ Sync completed:`)
		console.log(`   - Total: ${total}`)
		console.log(`   - Success: ${success}`)
		console.log(`   - Failed: ${failed}`)

		if (errors && errors.length > 0) {
			console.log(`   - Errors: ${JSON.stringify(errors)}`)
		}

		return response.data
	} catch (error) {
		if (axios.isAxiosError(error)) {
			console.error(`[${new Date().toISOString()}] ❌ Sync failed:`, error.message)
			if (error.response) {
				console.error(`   - Status: ${error.response.status}`)
				console.error(`   - Data: ${JSON.stringify(error.response.data)}`)
			}
		} else {
			console.error(`[${new Date().toISOString()}] ❌ Sync failed:`, error)
		}
		throw error
	}
}

/**
 * Initialize the cron job to sync tasks at 23:59 every day
 * Cron expression: '59 23 * * *' = 23:59 every day
 */
export function initSyncAICronJob() {
	// Schedule: At 23:59 every day
	const cronExpression = '59 23 * * *'

	cron.schedule(
		cronExpression,
		async () => {
			console.log(`[${new Date().toISOString()}] ⏰ Cron job triggered: Sync tasks to AI`)
			try {
				await syncTasksToAI()
			} catch (error) {
				// Error already logged in syncTasksToAI
			}
		},
		{
			timezone: 'Asia/Ho_Chi_Minh' // Vietnam timezone
		}
	)

	console.log('📅 Cron job scheduled: Sync tasks to AI at 23:59 daily (Asia/Ho_Chi_Minh timezone)')
}

// Export for manual trigger if needed
export { syncTasksToAI }
