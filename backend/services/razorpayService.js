const crypto = require('crypto');
const Razorpay = require('razorpay');

const getKeyId = () => process.env.RAZORPAY_KEY_ID || 'rzp_test_assetcare';
const getKeySecret = () => process.env.RAZORPAY_KEY_SECRET || 'test_secret_assetcare_key';
const getWebhookSecret = () => process.env.RAZORPAY_WEBHOOK_SECRET || getKeySecret();

const isConfigured = () => {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
};

let razorpayInstance = null;

const getRazorpayInstance = () => {
  const key_id = getKeyId();
  const key_secret = getKeySecret();
  if (!razorpayInstance || razorpayInstance.key_id !== key_id) {
    razorpayInstance = new Razorpay({
      key_id,
      key_secret
    });
  }
  return razorpayInstance;
};

/**
 * Creates an authoritative Razorpay order for the exact amount in paise
 */
const createRazorpayOrder = async ({ amountInPaise, currency = 'INR', receipt, notes = {} }) => {
  const rzp = getRazorpayInstance();
  try {
    const order = await rzp.orders.create({
      amount: amountInPaise,
      currency,
      receipt,
      notes
    });
    return order;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production' && !isConfigured()) {
      const mockOrderId = 'order_test_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex');
      return {
        id: mockOrderId,
        entity: 'order',
        amount: amountInPaise,
        amount_paid: 0,
        amount_due: amountInPaise,
        currency,
        receipt,
        status: 'created',
        attempts: 0,
        notes,
        created_at: Math.floor(Date.now() / 1000)
      };
    }
    throw err;
  }
};

/**
 * Cryptographically verifies Razorpay Payment Signature
 */
const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  if (!orderId || !paymentId || !signature) return false;
  try {
    const secret = getKeySecret();
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');
    const genBuf = Buffer.from(generatedSignature, 'utf8');
    const sigBuf = Buffer.from(signature, 'utf8');
    if (genBuf.length !== sigBuf.length) return false;
    return crypto.timingSafeEqual(genBuf, sigBuf);
  } catch (e) {
    return false;
  }
};

/**
 * Cryptographically verifies Razorpay Webhook Signature
 */
const verifyWebhookSignature = ({ rawBody, signature }) => {
  if (!rawBody || !signature) return false;
  try {
    const secret = getWebhookSecret();
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'))
      .digest('hex');
    const genBuf = Buffer.from(generatedSignature, 'utf8');
    const sigBuf = Buffer.from(signature, 'utf8');
    if (genBuf.length !== sigBuf.length) return false;
    return crypto.timingSafeEqual(genBuf, sigBuf);
  } catch (e) {
    return false;
  }
};

module.exports = {
  getKeyId,
  getKeySecret,
  getWebhookSecret,
  isConfigured,
  getRazorpayInstance,
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature
};
