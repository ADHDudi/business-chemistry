import { db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { traitsList } from '../constants';

const TOTAL_QUESTIONS = traitsList.length;

export async function checkAndMarkBothReady(
    sessionId: string,
    answersA: Record<number, number>,
    answersB: Record<number, number>
): Promise<void> {
    const aCount = Object.keys(answersA).length;
    const bCount = Object.keys(answersB).length;

    if (aCount < TOTAL_QUESTIONS || bCount < TOTAL_QUESTIONS) return;

    const sessionRef = doc(db, 'sessions', sessionId);
    await updateDoc(sessionRef, { status: 'both_ready' });
}
