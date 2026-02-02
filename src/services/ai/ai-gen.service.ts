import axios from 'axios'

class AiGenService {
	private aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/ai'

	async generateTask(body: any) {
		const res = await axios.post(
			`${this.aiServiceUrl}/llm/compose`,
			{ ...body },
			{
				timeout: 60_000,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)

		return res.data
	}

	async suggestDeveloper(body: any) {
		const res = await axios.post(
			`${this.aiServiceUrl}/llm/assign`,
			{ ...body },
			{
				timeout: 60_000,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
		return res.data
	}

	async estimateEffort(body: any) {
		const res = await axios.post(
			`${this.aiServiceUrl}/llm/estimate_sp`,
			{ ...body },
			{
				timeout: 60_000,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
		return res.data
	}
}

export const aiGenService = new AiGenService()
