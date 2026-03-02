import crypto from 'crypto'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import { VnpayConfig, VnpayParams } from '~/types/billing.type.js'

dayjs.extend(utc)
dayjs.extend(timezone)

const vnpayConfig: VnpayConfig = {
	vnpTmnCode: process.env.VNP_TMN_CODE || '',
	vnpHashSecret: process.env.VNP_HASH_SECRET || '',
	vnpUrl: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
	vnpReturnUrl: process.env.VNP_RETURN_URL || 'http://localhost:3000/api/billing/vnpay-return',
	vnpIpnUrl: process.env.VNP_IPN_URL || 'http://localhost:3000/api/billing/vnpay-ipn'
}

/**
 * Sort object keys alphabetically (required by VNPAY)
 */
function sortObject(obj: Record<string, string>): Record<string, string> {
	const sorted: Record<string, string> = {}
	const keys = Object.keys(obj).sort()
	for (const key of keys) {
		sorted[key] = obj[key]
	}
	return sorted
}

/**
 * Create VNPAY payment URL
 */
export function createPaymentUrl(params: {
	orderId: string
	amount: number // VNĐ (sẽ nhân 100 khi gửi VNPAY)
	orderInfo: string
	ipAddr: string
	locale?: string
	bankCode?: string
}): string {
	const { orderId, amount, orderInfo, ipAddr, locale = 'vn', bankCode } = params

	const createDate = dayjs().tz('Asia/Ho_Chi_Minh').format('YYYYMMDDHHmmss')
	const expireDate = dayjs().add(15, 'minute').tz('Asia/Ho_Chi_Minh').format('YYYYMMDDHHmmss')

	let vnpParams: Record<string, string> = {
		vnp_Version: '2.1.0',
		vnp_Command: 'pay',
		vnp_TmnCode: vnpayConfig.vnpTmnCode,
		vnp_Locale: locale,
		vnp_CurrCode: 'VND',
		vnp_TxnRef: orderId,
		vnp_OrderInfo: orderInfo,
		vnp_OrderType: 'billpayment',
		vnp_Amount: String(amount * 100), // VNPAY yêu cầu nhân 100
		vnp_ReturnUrl: vnpayConfig.vnpReturnUrl,
		vnp_IpAddr: ipAddr,
		vnp_CreateDate: createDate,
		vnp_ExpireDate: expireDate
	}

	if (bankCode) {
		vnpParams['vnp_BankCode'] = bankCode
	}

	vnpParams = sortObject(vnpParams)

	const searchParams = new URLSearchParams(vnpParams)
	const signData = searchParams.toString()

	const hmac = crypto.createHmac('sha512', vnpayConfig.vnpHashSecret)
	const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

	const paymentUrl = `${vnpayConfig.vnpUrl}?${signData}&vnp_SecureHash=${signed}`

	return paymentUrl
}

/**
 * Verify VNPAY return/IPN checksum
 * Returns true if the checksum is valid
 */
export function verifyChecksum(vnpParams: Record<string, string>): boolean {
	const secureHash = vnpParams['vnp_SecureHash']

	// Remove hash-related fields before verifying
	const params = { ...vnpParams }
	delete params['vnp_SecureHash']
	delete params['vnp_SecureHashType']

	const sortedParams = sortObject(params)
	const searchParams = new URLSearchParams(sortedParams)
	const signData = searchParams.toString()

	const hmac = crypto.createHmac('sha512', vnpayConfig.vnpHashSecret)
	const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

	return secureHash === signed
}

/**
 * Query transaction status from VNPAY (Querydr API)
 */
export async function queryTransaction(params: {
	vnpTxnRef: string
	transDate: string
	ipAddr: string
}): Promise<Record<string, any>> {
	const { vnpTxnRef, transDate, ipAddr } = params
	const requestId =
		dayjs().tz('Asia/Ho_Chi_Minh').format('YYYYMMDDHHmmss') + '_' + Math.random().toString(36).substring(7)
	const createDate = dayjs().tz('Asia/Ho_Chi_Minh').format('YYYYMMDDHHmmss')

	const queryData = {
		vnp_RequestId: requestId,
		vnp_Version: '2.1.0',
		vnp_Command: 'querydr',
		vnp_TmnCode: vnpayConfig.vnpTmnCode,
		vnp_TxnRef: vnpTxnRef,
		vnp_OrderInfo: `Truy van GD: ${vnpTxnRef}`,
		vnp_TransDate: transDate,
		vnp_CreateDate: createDate,
		vnp_IpAddr: ipAddr
	}

	// Create checksum for query API
	const dataToHash = [
		queryData.vnp_RequestId,
		queryData.vnp_Version,
		queryData.vnp_Command,
		queryData.vnp_TmnCode,
		queryData.vnp_TxnRef,
		queryData.vnp_TransDate,
		queryData.vnp_CreateDate,
		queryData.vnp_IpAddr,
		queryData.vnp_OrderInfo
	].join('|')

	const hmac = crypto.createHmac('sha512', vnpayConfig.vnpHashSecret)
	const checksum = hmac.update(Buffer.from(dataToHash, 'utf-8')).digest('hex')

	const { default: axios } = await import('axios')

	const response = await axios.post('https://sandbox.vnpayment.vn/merchant_webapi/api/transaction', {
		...queryData,
		vnp_SecureHash: checksum
	})

	return response.data
}

/**
 * Refund transaction via VNPAY Refund API
 */
export async function refundTransaction(params: {
	vnpTxnRef: string
	transactionNo: string
	amount: number // VNĐ
	transDate: string
	createBy: string
	ipAddr: string
}): Promise<Record<string, any>> {
	const { vnpTxnRef, transactionNo, amount, transDate, createBy, ipAddr } = params
	const requestId =
		dayjs().tz('Asia/Ho_Chi_Minh').format('YYYYMMDDHHmmss') + '_' + Math.random().toString(36).substring(7)
	const createDate = dayjs().tz('Asia/Ho_Chi_Minh').format('YYYYMMDDHHmmss')

	const refundData = {
		vnp_RequestId: requestId,
		vnp_Version: '2.1.0',
		vnp_Command: 'refund',
		vnp_TmnCode: vnpayConfig.vnpTmnCode,
		vnp_TransactionType: '02', // Hoàn toàn phần
		vnp_TxnRef: vnpTxnRef,
		vnp_Amount: String(amount * 100),
		vnp_OrderInfo: `Hoan tien GD: ${vnpTxnRef}`,
		vnp_TransactionNo: transactionNo,
		vnp_TransactionDate: transDate,
		vnp_CreateBy: createBy,
		vnp_CreateDate: createDate,
		vnp_IpAddr: ipAddr
	}

	const dataToHash = [
		refundData.vnp_RequestId,
		refundData.vnp_Version,
		refundData.vnp_Command,
		refundData.vnp_TmnCode,
		refundData.vnp_TransactionType,
		refundData.vnp_TxnRef,
		refundData.vnp_Amount,
		refundData.vnp_TransactionNo,
		refundData.vnp_TransactionDate,
		refundData.vnp_CreateBy,
		refundData.vnp_CreateDate,
		refundData.vnp_IpAddr,
		refundData.vnp_OrderInfo
	].join('|')

	const hmac = crypto.createHmac('sha512', vnpayConfig.vnpHashSecret)
	const checksum = hmac.update(Buffer.from(dataToHash, 'utf-8')).digest('hex')

	const { default: axios } = await import('axios')

	const response = await axios.post('https://sandbox.vnpayment.vn/merchant_webapi/api/transaction', {
		...refundData,
		vnp_SecureHash: checksum
	})

	return response.data
}

export default {
	createPaymentUrl,
	verifyChecksum,
	queryTransaction,
	refundTransaction,
	config: vnpayConfig
}
