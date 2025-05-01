import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
            { role: 'system', content: 'You are a cybersecurity assistant. Analyze the email for phishing risk.' },
            { role: 'user', content: `Analyze this message:\n\n${message}\n\nRespond with:\n1. A clear explanation.\n2. A phishingRiskScore from 0 to 1.` },
        ],
    });


    const responseText = completion.choices[0].message.content || "";
    const explanation = responseText.split('1.')[1]?.split('2.')[0]?.trim() || responseText;
    const scoreMatch = responseText.match(/phishingRiskScore.*?(0\.\d+|1(\.0)?)/i);
    const aiScore = scoreMatch ? parseFloat(scoreMatch[1]) : 0;


    return NextResponse.json({
        explanation,
        aiScore,
    });

}
