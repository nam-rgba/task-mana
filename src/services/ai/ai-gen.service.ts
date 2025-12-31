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

		console.log('AI Service Response:', res.data)

		return res.data
	}
}

export const aiGenService = new AiGenService()
