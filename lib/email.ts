import nodemailer from "nodemailer";

interface SendEmailProps {
    to: string;
    subject: string;
    html: string;
}

// Ensure you have these in your .env
// GMAIL_USER=your-email@gmail.com
// GMAIL_APP_PASSWORD=your-app-password

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

export const sendEmail = async ({ to, subject, html }: SendEmailProps) => {
    try {
        const info = await transporter.sendMail({
            from: `"Zavvy" <${process.env.GMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log("Email sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error };
    }
};

export const sendWelcomeEmail = async (email: string, name: string, tier: "starter" | "founder") => {
    const subject = "Welcome to Zavvy! Let's Scale 🚀";

    // Simple tiered content logic
    const founderContent = `
      <p>Hey ${name},</p>
      <p>You're in! Welcome to the <strong>Founder Tier</strong>.</p>
      <p>You've secured lifetime access to our premium features. We're thrilled to have you as one of our first 50 founding members.</p>
    `;

    const starterContent = `
      <p>Hey ${name},</p>
      <p>Welcome to Zavvy! You're on the Starter plan.</p>
      <p>We're excited to help you automate your business.</p>
    `;

    const html = `
      <div style="font-family: sans-serif; color: #333;">
        <h1>Welcome to Zavvy</h1>
        ${tier === "founder" ? founderContent : starterContent}
        <p>Click <a href="https://zavvy.co/dashboard">here</a> to access your dashboard.</p>
        <p>Best,<br/>The Zavvy Team</p>
      </div>
    `;

    return sendEmail({ to: email, subject, html });
};
