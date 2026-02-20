import { getSheet, setCorsHeaders, SHEET_HEADERS } from './lib/googleSheet.js';

export default async function handler(req, res) {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const sheet = await getSheet();
        const rows = await sheet.getRows();
        const students = rows.map(row => {
            const obj = {};
            SHEET_HEADERS.forEach(h => obj[h] = row.get(h));
            return obj;
        });

        res.status(200).json({ success: true, data: students });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
