import { getSheet, setCorsHeaders, SHEET_HEADERS } from './lib/googleSheet.js';

export default async function handler(req, res) {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { studentId, month, year, amount, status, current_month_paid } = req.body;

        if (!studentId || !month || !year) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const sheet = await getSheet();
        const rows = await sheet.getRows();

        // 1. Try to find existing row for this month
        const existingRow = rows.find(r =>
            String(r.get('id')) === String(studentId) &&
            String(r.get('month')) === String(month) &&
            String(r.get('year')) === String(year)
        );

        if (existingRow) {
            // Update existing
            existingRow.assign({ amount, status, current_month_paid });
            await existingRow.save();
            return res.status(200).json({ success: true, action: 'updated' });
        }

        // 2. Not found -> Insert new row
        // We need profile info from another row of this student
        const studentProfile = rows.find(r => String(r.get('id')) === String(studentId));

        if (!studentProfile) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const newRow = {
            id: String(studentId),
            username: studentProfile.get('username'),
            email: studentProfile.get('email'),
            mobile: studentProfile.get('mobile'),
            aadhar_number: studentProfile.get('aadhar_number'),
            monthly_fee: studentProfile.get('monthly_fee'),
            subscription_start: studentProfile.get('subscription_start'),
            subscription_end: studentProfile.get('subscription_end'),
            current_month_paid,
            month,
            year,
            amount,
            status
        };

        await sheet.addRow(newRow);
        res.status(200).json({ success: true, action: 'inserted' });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
