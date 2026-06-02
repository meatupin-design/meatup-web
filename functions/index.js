const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const twilio = require("twilio");

admin.initializeApp();

// Ensure these are set in functions/.env or Firebase Config
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || process.env.EXPO_PUBLIC_RAZORPAY_KEY_SECRET || "";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;
const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER;

let razorpay;
if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
        key_id: RAZORPAY_KEY_ID,
        key_secret: RAZORPAY_KEY_SECRET,
    });
}

let client;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

/**
 * Triggered when a new order is created in Firestore.
 * Sends a WhatsApp notification to the Admin.
 */
exports.onOrderCreated = onDocumentCreated("orders/{orderId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        logger.info("No data associated with the event");
        return;
    }

    const order = snapshot.data();
    const orderId = order.display_id || event.params.orderId;

    logger.info(`New Order Detected: ${orderId}. Sending notification...`);

    try {
        // 1. Fetch User details (for name)
        const userDoc = await admin.firestore().collection("users").doc(order.user_id).get();
        const userData = userDoc.data();
        const customerName = userData ? userData.name : "Customer";

        // 2. Format Items list
        const itemsList = order.items.map(item => 
            `- ${item.name} x ${item.quantity} (${item.weight}${item.unit || 'kg'}${item.cuttingType ? `, ${item.cuttingType}` : ''})`
        ).join('\n');

        // 3. Construct Message
        const messageHeader = `🛍️ *New Order Received!*`;
        const messageBody = 
            `🆔 *Order ID:* #${orderId}\n` +
            `👤 *Customer:* ${customerName}\n` +
            `📍 *Address:* ${order.address}\n\n` +
            `📦 *Items:*\n${itemsList}\n\n` +
            `💰 *Total:* ₹${order.final_amount.toFixed(2)}\n` +
            `💳 *Payment:* ${order.payment_mode.toUpperCase()}`;
        
        const messageFooter = `\n\n_Sent from MeatUP Cloud_`;

        const fullMessage = `${messageHeader}\n\n${messageBody}${messageFooter}`;

        // 4. Send via Twilio
        if (client && TWILIO_WHATSAPP_FROM && ADMIN_WHATSAPP_NUMBER) {
            await client.messages.create({
                from: TWILIO_WHATSAPP_FROM,
                to: ADMIN_WHATSAPP_NUMBER,
                body: fullMessage,
            });
            logger.info(`WhatsApp notification successfully sent for order ${orderId}`);
        } else {
            logger.warn("Twilio client not initialized. Skipping WhatsApp notification.");
        }
    } catch (error) {
        logger.error("Failed to send WhatsApp notification:", error);
    }
});

exports.createRazorpayOrder = onCall({ cors: true }, async (request) => {
    // ... authentication and logic ...
    if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "The function must be called while authenticated."
        );
    }

    logger.info("Received request data:", request.data);

    const amount = request.data.amount;
    const currency = request.data.currency || "INR";

    if (!amount) {
        throw new HttpsError("invalid-argument", "The function must be called with an 'amount'.");
    }

    const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
        currency,
        receipt: `receipt_order_${Date.now()}`,
    };

    try {
        if (!razorpay) {
            throw new HttpsError("failed-precondition", "Razorpay is not configured on the server.");
        }
        const order = await razorpay.orders.create(options);
        logger.info("Razorpay Order Created", { orderId: order.id });
        return {
            id: order.id,
            amount: order.amount,
            currency: order.currency,
        };
    } catch (error) {
        logger.error("Error creating Razorpay order:", error);
        throw new HttpsError("internal", "Failed to create Razorpay order.");
    }
});
