import { getSheet, setCorsHeaders, SHEET_HEADERS } from './lib/googleSheet.js';

export default async function handler(req, res) {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'PUT' && req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { id, updates } = req.body;
        if (!id || !updates) return res.status(400).json({ error: 'Missing id or updates' });

        const sheet = await getSheet();
        const rows = await sheet.getRows();

        let updatedCount = 0;
        // Search by ID and update ALL matching rows (profile update affects all history for that student)
        for (const row of rows) {
            if (String(row.get('id')) === String(id)) {
                Object.keys(updates).forEach(key => {
                    if (SHEET_HEADERS.includes(key)) row.assign({ [key]: updates[key] });
                });
                await row.save();
                updatedCount++;
            }
        }

        res.status(200).json({ success: true, updated: updatedCount });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
