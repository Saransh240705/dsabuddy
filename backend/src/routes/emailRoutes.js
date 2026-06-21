import express from 'express';
import { sendWelcomeEmail, sendDailyPotdEmail } from '../controller/mailerController.js';
import { prisma } from '../config/prismaClient.js';

const router = express.Router();

router.post('/welcome', async (req, res) => {
    const { to, name } = req.body;

    if (!to) {
        return res.status(400).json({ error: 'Recipient email "to" is required' });
    }

    try {
        const info = await sendWelcomeEmail(to, name || 'User');
        res.status(200).json({ message: 'Welcome email sent successfully', info });
    } catch (error) {
        res.status(500).json({ message: 'Error sending welcome email', error: error.message });
    }
});

router.post('/potd', async (req, res) => {
    const { to, name, problemId } = req.body;

    if (!to) {
        return res.status(400).json({ error: 'Recipient email "to" is required' });
    }

    try {
        let problem = null;
        if (problemId) {
            problem = await prisma.question.findUnique({
                where: { id: problemId }
            });
        }

        if (!problem) {
            // Select a random question from DB
            const count = await prisma.question.count();
            if (count > 0) {
                const skip = Math.floor(Math.random() * count);
                const randomProblems = await prisma.question.findMany({
                    take: 1,
                    skip: skip
                });
                problem = randomProblems[0];
            }
        }

        const info = await sendDailyPotdEmail(to, name || 'User', problem);
        res.status(200).json({ message: 'Daily POTD email sent successfully', problem, info });
    } catch (error) {
        res.status(500).json({ message: 'Error sending POTD email', error: error.message });
    }
});

export default router;
