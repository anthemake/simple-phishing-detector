import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { message, result } = await req.json();

        if (!message || !result) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        await addDoc(collection(db, 'phishing_logs'), {
            message,
            result,
            timestamp: serverTimestamp(),
        });


        return NextResponse.json({ status: 'logged' });
    } catch (err) {

        return NextResponse.json({ error: 'Logging failed' }, { status: 500 });
    }
}
