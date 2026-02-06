
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

type EmailTier = 'free' | 'pro';

export async function sendWelcomeEmail(to: string, tier: EmailTier) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.warn('⚠️ Gmail credentials not set. Email will not be sent.');
        return;
    }

    const isPro = tier === 'pro';

    const subject = isPro
        ? "🚀 You're a Zavvy Founder! (Status Confirmed)"
        : "Welcome to Zavvy! 🎉";

    const html = isPro
        ? getProTemplate()
        : getFreeTemplate();

    try {
        const info = await transporter.sendMail({
            from: '"Zavvy Team" <jayasukuv11@gmail.com>',
            to,
            subject,
            html,
        });
        console.log(`✅ Email sent to ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return { success: false, error };
    }
}

function getFreeTemplate() {
    return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h1 style="color: #0d9488;">Welcome to Zavvy! 🎉</h1>
      <p>Hi there,</p>
      <p>Thanks for joining the Zavvy waitlist! You're one step closer to automating your Instagram and WhatsApp sales.</p>
      
      <div style="background: #f0fdfa; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #ccfbf1;">
        <h3 style="margin-top: 0; color: #115e59;">What you'll get:</h3>
        <ul style="padding-left: 20px;">
          <li>Free access to basic automation tools</li>
          <li>Manage up to 50 orders/month</li>
          <li>Community access</li>
        </ul>
      </div>
      
      <p>We'll notify you as soon as we launch. In the meantime, get your product catalog ready!</p>
      <p>Stay tuned,<br>The Zavvy Team</p>
    </div>
  `;
}

function getProTemplate() {
    return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h1 style="color: #be185d;">🚀 You're a Zavvy Founder!</h1>
      <p>Congratulations! You've secured one of the exclusive <strong>50 Founder spots</strong>.</p>
      
      <div style="background: #fdf2f8; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #fbcfe8;">
        <h2 style="margin-top: 0; color: #9d174d;">Your Founder Benefits:</h2>
        <ul style="padding-left: 20px; font-size: 16px; line-height: 1.6;">
          <li><strong>₹300/month forever</strong> (Regular price: ₹499/mo)</li>
          <li>✅ Unlimited orders & products</li>
          <li>✅ Priority WhatsApp support</li>
          <li>✅ Exclusive "Founder" profile badge</li>
          <li>✅ Early access to new AI features</li>
        </ul>
      </div>
      
      <p>This rate is locked in for you as long as you stay subscribed.</p>
      <p>We'll be sending your onboarding invite very soon. Welcome to the founding team!</p>
      
      <p>Cheers,<br>The Zavvy Team</p>
    </div>
  `;
}
