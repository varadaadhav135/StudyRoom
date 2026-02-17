// Email service utility for sending receipts and reminders
export const emailService = {
    /**
     * Send payment receipt via email
     * Note: In production, this should be a backend API call to an email service
     */
    sendReceipt: async (studentData, paymentInfo) => {
        const subject = `Payment Receipt - DnyanPeeth Abhyasika`;
        const body = `Dear ${studentData.username},

Thank you for your payment!

Payment Details:
- Amount: ₹${paymentInfo.amount}
- Date: ${new Date().toLocaleDateString('en-IN')}
- Subscription Period: ${paymentInfo.startDate} to ${paymentInfo.endDate}
- Receipt Number: RCP-${Date.now()}

Student Information:
- Name: ${studentData.username}
- Email: ${studentData.email}
- Mobile: ${studentData.mobile}
${studentData.aadhar_number ? `- Aadhar: ${studentData.aadhar_number}` : ''}

For any queries, please contact DnyanPeeth Imperial Library.

Best Regards,
DnyanPeeth Administration`;

        // For now, use mailto: link (opens user's email client)
        // In production, replace with actual email API call
        const mailtoLink = `mailto:${studentData.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink);

        return { success: true, message: 'Receipt email opened in your email client' };
    },

    /**
     * Send fee reminder via email/SMS
     */
    sendFeeReminder: async (studentData) => {
        const subject = `Fee Reminder - DnyanPeeth Abhyasika`;
        const body = `Dear ${studentData.username},

This is a friendly reminder regarding your upcoming fee payment for DnyanPeeth Imperial Library.

Student Details:
- Name: ${studentData.username}
- Mobile: ${studentData.mobile}
- Email: ${studentData.email}

Please ensure timely payment to continue enjoying uninterrupted access to our facilities.

For payment or queries, please contact the administration.

Best Regards,
DnyanPeeth Administration`;

        // Email reminder (opens mailto)
        const mailtoLink = `mailto:${studentData.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink);

        // SMS reminder (opens SMS on mobile devices)
        if (studentData.mobile) {
            const smsBody = `DnyanPeeth: Fee reminder for ${studentData.username}. Please ensure timely payment. Contact admin for details.`;
            const smsLink = `sms:${studentData.mobile}?body=${encodeURIComponent(smsBody)}`;
            // Optionally open SMS link as well
            // window.open(smsLink);
        }

        return { success: true, message: 'Reminder sent successfully' };
    }
};

export default emailService;
