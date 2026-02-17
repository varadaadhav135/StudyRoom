# Fast2SMS Setup Guide (FREE)

## Quick Start - 100% FREE!

### 1. Create Fast2SMS Account (2 minutes)

1. Go to https://www.fast2sms.com/
2. Click **Get Free API** (top right)
3. Sign up with your mobile number
4. Verify OTP
5. **Done!** You get **50 free SMS per day**

### 2. Get Your API Key

1. Login to Fast2SMS
2. Go to **Dev API** (left menu)
3. Copy your **API Key**
4. Save it - you'll need it next!

### 3. Add to Environment Variables

#### Local (`.env`)
```env
VITE_FAST2SMS_API_KEY=your_copied_api_key_here
CRON_SECRET=generate_random_secret
```

Generate secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Vercel
1. Project Settings → Environment Variables
2. Add: `VITE_FAST2SMS_API_KEY`
3. Add: `CRON_SECRET` (same as above)

#### GitHub
1. Repository → Settings → Secrets
2. Add: `CRON_SECRET` (same as above)

### 4. Test It!

```bash
# Start dev server
pnpm run dev

# Login to admin dashboard
# Click "Remind" button on any student
# Check if SMS is received
```

## Free Tier Limits

- **50 SMS per day** ✅ FREE
- No credit card required
- Indian mobile numbers only
- Perfect for small libraries!

## If You Need More

| Students Expiring/Day | Solution |
|----------------------|----------|
| < 50 | Free tier (perfect!) |
| 50-100 | Upgrade to paid (~₹200/month) |
| > 100 | Consider MSG91 bulk pricing |

## Troubleshooting

**SMS not received?**
- Check API key is correct
- Verify mobile number (10 digits)
- Check Fast2SMS dashboard for errors
- Verify daily limit not exceeded

**"Unauthorized" error?**
- API key must start with fresh login
- Copy-paste carefully (no spaces)
- Check `.env` file is saved

## Support

- Fast2SMS Docs: https://www.fast2sms.com/dashboard/dev-api
- Free support: support@fast2sms.com
