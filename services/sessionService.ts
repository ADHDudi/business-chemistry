import { db } from '../firebaseConfig';
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    onSnapshot,
    getDoc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';

export interface SessionData {
    sessionId: string;
    createdAt: any; // Timestamp

    // User A (Creator)
    founderAName: string;
    founderAEmail: string;
    answersA: Record<number, number>;

    // User B (Joiner)
    founderBName: string;
    founderBEmail: string;
    answersB: Record<number, number>;
}

const generateSessionId = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export const createSession = async (name: string, email: string): Promise<string> => {
    const sessionId = generateSessionId();
    const sessionRef = doc(db, 'sessions', sessionId);

    const initialData: SessionData = {
        sessionId,
        createdAt: serverTimestamp(),
        founderAName: name,
        founderAEmail: email,
        answersA: {},
        founderBName: '',
        founderBEmail: '',
        answersB: {}
    };

    await setDoc(sessionRef, initialData);
    return sessionId;
};

export const joinSession = async (sessionId: string, name: string, email: string): Promise<SessionData | null> => {
    const sessionRef = doc(db, 'sessions', sessionId);
    const snapshot = await getDoc(sessionRef);

    if (!snapshot.exists()) {
        return null;
    }

    // Only update if B is not already set (or if we want to allow overwriting, but let's be safe)
    // For now, simpler is better: always update B info on join
    await updateDoc(sessionRef, {
        founderBName: name,
        founderBEmail: email
    });

    return snapshot.data() as SessionData;
};

export const updateAnswers = async (sessionId: string, role: 'A' | 'B', answers: Record<number, number>) => {
    const sessionRef = doc(db, 'sessions', sessionId);
    const field = role === 'A' ? 'answersA' : 'answersB';

    await updateDoc(sessionRef, {
        [field]: answers
    });
};

export const subscribeToSession = (sessionId: string, callback: (data: SessionData) => void) => {
    const sessionRef = doc(db, 'sessions', sessionId);

    return onSnapshot(sessionRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data() as SessionData);
        }
    });
};
