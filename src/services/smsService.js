import axios from 'axios';

const FAST2SMS_API_KEY = import.meta.env.VITE_FAST2SMS_API_KEY;

export const smsService = {
    /**
     * Send SMS via Fast2SMS (FREE tier: 50 SMS/day)
     * @param {string} mobile - Mobile number (10 digits)
     * @param {string} message - SMS message content
     */
    sendSMS: async (mobile, message) => {
        try {
            // Validate inputs
            if (!mobile || !message) {
                throw new Error('Mobile number and message are required');
            }

            if (!FAST2SMS_API_KEY) {
                console.warn('FAST2SMS_API_KEY not configured - SMS will not be sent');
                return {
                    success: false,
                    error: 'Fast2SMS API key not configured. Please add VITE_FAST2SMS_API_KEY to .env'
                };
            }

            // Clean mobile number (remove +91, spaces, etc.)
            const cleanMobile = mobile.replace(/\D/g, '').slice(-10);

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

            console.log('SMS sent successfully:', response.data);
            return { success: true, data: response.data };

        } catch (error) {
            console.error('SMS Error:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    },

    /**
     * Send subscription expiry reminder
     * @param {Object} student - Student object with username, mobile, subscription_end
     */
    sendExpiryReminder: async (student) => {
        const endDate = new Date(student.subscription_end).toLocaleDateString('en-IN');
        const message = `Hi ${student.username}, your DnyanPeeth library subscription expires on ${endDate}. Please renew to continue access. Contact admin for details.`;

        return await smsService.sendSMS(student.mobile, message);
    },

    /**
     * Send payment reminder for monthly fee
     * @param {Object} student - Student object with username, mobile, monthly_fee
     */
    sendPaymentReminder: async (student) => {
        const amount = student.monthly_fee || 500;
        const message = `Hi ${student.username}, reminder to pay Rs.${amount} for DnyanPeeth library fees this month. Thank you!`;

        return await smsService.sendSMS(student.mobile, message);
    },

    /**
     * Send custom SMS
     * @param {Object} student - Student object with mobile
     * @param {string} customMessage - Custom message to send
     */
    sendCustomMessage: async (student, customMessage) => {
        return await smsService.sendSMS(student.mobile, customMessage);
    }
};

export default smsService;
