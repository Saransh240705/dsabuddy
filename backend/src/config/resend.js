import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.warn('WARNING: RESEND_API_KEY is not configured or using placeholder. Email sending may fail.');
}

const resend = new Resend(apiKey);

export default resend;
