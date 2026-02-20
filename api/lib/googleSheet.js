import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Shared headers configuration
export const SHEET_HEADERS = [
    'id', 'username', 'email', 'mobile', 'aadhar_number', 'monthly_fee',
    'subscription_start', 'subscription_end', 'current_month_paid',
    'month', 'year', 'amount', 'status'
];

export async function getSheet() {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const serviceAccountKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    const sheetId = process.env.VITE_GOOGLE_SHEET_ID;

    if (!serviceAccountEmail || !serviceAccountKey || !sheetId) {
        throw new Error('Missing Google Sheets credentials in environment variables');
    }

    const auth = new JWT({
        email: serviceAccountEmail,
        key: serviceAccountKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(sheetId, auth);
    await doc.loadInfo();
    return doc.sheetsByIndex[0]; // Assuming "Student" is the first sheet
}

// Helper for CORS headers
export function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    // Prevent browser and CDN caching of API responses
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
}

