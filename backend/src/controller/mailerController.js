import resend from '../config/resend.js';
import { getWelcomeEmailTemplate, getPotdEmailTemplate } from '../utils/emailTemplates.js';

export const sendEmail = async (to, subject, content) => {
    try {
        const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
        const isHtml = typeof content === 'string' && content.trim().startsWith('<');
        
        const emailPayload = {
            from: fromEmail,
            to,
            subject,
        };

        if (isHtml) {
            emailPayload.html = content;
        } else {
            emailPayload.text = content;
        }

        const { data, error } = await resend.emails.send(emailPayload);

        if (error) {
            console.error('Resend API Error details:', error);
            throw new Error(error.message || 'Unknown Resend Error');
        }

        console.log('Email sent successfully via Resend. ID:', data?.id);
        return data;
    } catch (error) {
        console.error('Error sending email via Resend:', error);
        throw error;
    }
};

export const sendWelcomeEmail = async (to, name) => {
    const subject = 'Welcome to DSA Buddy! 🚀';
    const htmlContent = getWelcomeEmailTemplate(name);
    return sendEmail(to, subject, htmlContent);
};

export const sendDailyPotdEmail = async (to, name, problem) => {
    const subject = `Daily DSA Challenge: ${problem.displayName || problem.title} 🎯`;
    const htmlContent = getPotdEmailTemplate(name, problem);
    return sendEmail(to, subject, htmlContent);
};
