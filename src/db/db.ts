export const connectDb = async () => {
	try {
		prisma.$connect()
		console.log('✅ Database connected successfully!')
	} catch (error) {
		console.error('❌ Database connection failed:', error)
		process.exit(1)
	}
}
