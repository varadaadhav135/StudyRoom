import axios from 'axios';

const SHEETDB_API_URL = process.env.VITE_SHEETDB_API_URL;
const FAST2SMS_API_KEY = process.env.VITE_FAST2SMS_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * API endpoint for automatic daily reminders
 * Called by GitHub Actions at 9 AM IST daily
 * Sends SMS to students with subscriptions ending tomorrow
 * Uses Fast2SMS FREE tier (50 SMS/day limit)
 */
export default async function handler(req, res) {
    // Security: Verify request is from GitHub Actions
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // 1. Fetch all students from SheetDB
        const response = await axios.get(SHEETDB_API_URL);
        const students = response.data;

        // 2. Calculate tomorrow's date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        // 3. Find students with subscriptions ending tomorrow
        const expiringSoon = students.filter(student => {
            if (!student.subscription_end) return false;

            const endDate = new Date(student.subscription_end);
            endDate.setHours(0, 0, 0, 0);

            return endDate.getTime() === tomorrow.getTime();
        });

        console.log(`Found ${expiringSoon.length} students with subscriptions ending tomorrow`);

        // Check free tier limit
        if (expiringSoon.length > 50) {
            console.warn(`Warning: ${expiringSoon.length} students exceed Fast2SMS free limit (50/day)`);
        }

        // 4. Send SMS to each student
        const results = [];
        for (const student of expiringSoon) {
            if (!student.mobile) {
                results.push({
                    student: student.username,
                    mobile: 'N/A',
                    sent: false,
                    error: 'No mobile number'
                });
                continue;
            }

            const endDate = new Date(student.subscription_end).toLocaleDateString('en-IN');
            const message = `Hi ${student.username}, your DnyanPeeth library subscription expires tomorrow (${endDate}). Please renew to continue access. Contact admin for details.`;

            try {
                const cleanMobile = student.mobile.replace(/\D/g, '').slice(-10);

                const smsResult = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
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

                results.push({
                    student: student.username,
                    mobile: cleanMobile,
                    sent: true,
                    response: smsResult.data
                });

                console.log(`SMS sent to ${student.username} (${cleanMobile})`);

            } catch (smsError) {
                results.push({
                    student: student.username,
                    mobile: student.mobile,
                    sent: false,
                    error: smsError.message
                });
                console.error(`Failed to send SMS to ${student.username}:`, smsError);
            }
        }

        return res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            studentsChecked: students.length,
            expiringTomorrow: expiringSoon.length,
            smsSent: results.filter(r => r.sent).length,
            freeTierLimit: 50,
            withinLimit: expiringSoon.length <= 50,
            results
        });

    } catch (error) {
        console.error('Reminder Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
