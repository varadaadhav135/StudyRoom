import { getSheet, setCorsHeaders } from './lib/googleSheet.js';

export default async function handler(req, res) {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { row } = req.body;
        if (!row) return res.status(400).json({ error: 'Missing row data' });

        const sheet = await getSheet();
        await sheet.addRow(row);

        res.status(200).json({ success: true, message: 'Student added successfully' });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
