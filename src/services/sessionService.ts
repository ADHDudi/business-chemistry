import { db } from '../firebaseConfig';
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    onSnapshot,
    getDoc,
    serverTimestamp,
} from 'firebase/firestore';

export interface SessionData {
    sessionId: string;
    createdAt: any;
    status: 'waiting' | 'in_progress' | 'both_ready';

    founderAUid: string;
    founderAName: string;
    founderAEmail: string;
    answersA: Record<number, number>;

    founderBUid: string;
    founderBName: string;
    founderBEmail: string;
    answersB: Record<number, number>;

    partnerLeft?: boolean;
}

const generateSessionId = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export const createSession = async (name: string, email: string, uid: string): Promise<string> => {
    const sessionId = generateSessionId();
    const sessionRef = doc(db, 'sessions', sessionId);

    const initialData: SessionData = {
        sessionId,
        createdAt: serverTimestamp(),
        status: 'waiting',
        founderAUid: uid,
        founderAName: name,
        founderAEmail: email,
        answersA: {},
        founderBUid: '',
        founderBName: '',
        founderBEmail: '',
        answersB: {},
    };

    await setDoc(sessionRef, initialData);
    return sessionId;
};

export const joinSession = async (
    sessionId: string,
    name: string,
    email: string,
    uid: string
): Promise<SessionData> => {
    const sessionRef = doc(db, 'sessions', sessionId);
    const snapshot = await getDoc(sessionRef);

    if (!snapshot.exists()) {
        throw new Error('Session not found');
    }

    const data = snapshot.data() as SessionData;
    if (data.founderBName) {
        throw new Error('Session is full');
    }

    await updateDoc(sessionRef, {
        founderBUid: uid,
        founderBName: name,
        founderBEmail: email,
        status: 'in_progress',
    });

    return data;
};

export const updateAnswers = async (sessionId: string, role: 'A' | 'B', answers: Record<number, number>) => {
    const sessionRef = doc(db, 'sessions', sessionId);
    const field = role === 'A' ? 'answersA' : 'answersB';
    await updateDoc(sessionRef, { [field]: answers });
};

export const getUserSessions = async (uid: string): Promise<SessionData[]> => {
    const { getDocs, query, collection, where, orderBy } = await import('firebase/firestore');
    const ref = collection(db, 'sessions');
    const qA = query(ref, where('founderAUid', '==', uid), orderBy('createdAt', 'desc'));
    const qB = query(ref, where('founderBUid', '==', uid), orderBy('createdAt', 'desc'));
    const [snapA, snapB] = await Promise.all([getDocs(qA), getDocs(qB)]);
    const sessionMap = new Map<string, SessionData>();
    [...snapA.docs, ...snapB.docs].forEach(d => {
        const data = d.data() as SessionData;
        sessionMap.set(data.sessionId, data);
    });
    return Array.from(sessionMap.values()).sort((a, b) => {
        const tA = a.createdAt?.seconds ?? 0;
        const tB = b.createdAt?.seconds ?? 0;
        return tB - tA;
    });
};

export const subscribeToSession = (sessionId: string, callback: (data: SessionData) => void) => {
    const sessionRef = doc(db, 'sessions', sessionId);
    return onSnapshot(sessionRef, (snap) => {
        if (snap.exists()) {
            callback(snap.data() as SessionData);
        }
    });
};
