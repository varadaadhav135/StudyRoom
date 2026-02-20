import { getSheet, setCorsHeaders } from './lib/googleSheet.js';

export default async function handler(req, res) {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'Missing id' });

        const sheet = await getSheet();
        const rows = await sheet.getRows();

        const rowsToDelete = rows.filter(r => String(r.get('id')) === String(id));
        let deletedCount = 0;

        for (const row of rowsToDelete) {
            await row.delete();
            deletedCount++;
        }

        res.status(200).json({ success: true, deleted: deletedCount });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
