const nodemailer = require('nodemailer');

function getTransporter() {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (user && pass) {
        return nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: user,
                pass: pass,
            },
        });
    }
    return null;
}

async function sendOTPEmail(email, otp) {
    const transporter = getTransporter();
    const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const mailOptions = {
        from: `"LoopLedger" <${process.env.EMAIL_USER || 'no-reply@loopledger.com'}>`,
        to: email,
        // Unique subject and headers prevent Gmail from bundling multiple OTPs into one conversation thread
        subject: `Your LoopLedger OTP: ${otp} [${timestamp}]`,
        headers: {
            'X-Entity-Ref-ID': Date.now().toString(),
            'X-Auto-Response-Suppress': 'OOF, AutoReply',
        },
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 28px 24px; border: 1px solid #e5e7eb; border-radius: 16px; background: #ffffff;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="color: #4338ca; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">LoopLedger</h2>
                    <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Account Verification</p>
                </div>
                <div style="padding: 24px; background: #f9fafb; border-radius: 12px; text-align: center; border: 1px solid #f3f4f6;">
                    <p style="color: #374151; font-size: 15px; margin: 0 0 16px;">Use this One-Time Password to complete your registration:</p>
                    <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #4338ca; padding: 14px 20px; background: #eef2ff; border-radius: 10px; display: inline-block;">
                        ${otp}
                    </div>
                    <p style="color: #6b7280; font-size: 13px; margin: 16px 0 0;">
                        ⏱ Valid for <strong>10 minutes</strong>. Do not share this code.
                    </p>
                </div>
                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
                    Generated at ${timestamp}. If you did not request this, you can safely ignore this email.
                </p>
            </div>
        `,
    };

    if (transporter) {
        return await transporter.sendMail(mailOptions);
    } else {
        console.log('\n==========================================');
        console.log(`[DEV OTP NOTIFICATION]`);
        console.log(`To: ${email}`);
        console.log(`Verification OTP: ${otp}`);
        console.log('==========================================\n');
        return { messageId: 'dev-console-mock' };
    }
}

module.exports = { sendOTPEmail };
