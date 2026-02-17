import axios from 'axios';

const FAST2SMS_API_KEY = process.env.VITE_FAST2SMS_API_KEY;

/**
 * API endpoint for manual SMS sending
 * Called by admin dashboard "Remind" button
 * Sends immediate SMS to a single student
 * Uses Fast2SMS FREE tier
 */
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { mobile, message, studentName } = req.body;

    // Validate input
    if (!mobile || !message) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: mobile and message'
        });
    }

    if (!FAST2SMS_API_KEY) {
        return res.status(500).json({
            success: false,
            error: 'Fast2SMS API key not configured'
        });
    }

    try {
        // Clean mobile number (remove +91, spaces, etc.)
        const cleanMobile = mobile.replace(/\D/g, '').slice(-10);

        // Send SMS via Fast2SMS
        const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
            route: 'q',
            message: message,
            language: 'english',
            flash: 0,
            numbers: cleanMobile
        }, {
            headers: {
                'authorization': FAST2SMS_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Manual SMS sent to ${studentName || cleanMobile}`);

        return res.status(200).json({
            success: true,
            message: `SMS sent to ${studentName || cleanMobile}`,
            mobile: cleanMobile,
            timestamp: new Date().toISOString(),
            data: response.data
        });

    } catch (error) {
        console.error('SMS Error:', error);
        return res.status(500).json({
            success: false,
            error: error.response?.data?.message || error.message,
            timestamp: new Date().toISOString()
        });
    }
}
