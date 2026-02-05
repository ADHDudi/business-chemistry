import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";

// --- Configuration (Duplicated from keys found in project) ---
const firebaseConfig = {
    apiKey: "AIzaSyB9O_r05qM539ioQU7bBCgf__-GR6rg_pw",
    authDomain: "business-chemistry.firebaseapp.com",
    projectId: "business-chemistry",
    storageBucket: "business-chemistry.firebasestorage.app",
    messagingSenderId: "28475858240",
    appId: "1:28475858240:web:0e9005fa20c7f19fa42ea5",
    measurementId: "G-VQWGCEZW6L"
};

// Initialize Firebase (No Analytics to avoid Node issues)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Helpers ---
const generateSessionId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// --- Main Simulation ---
async function runSimulation() {
    console.log("🤖 AI Founder A: Initializing...");

    const sessionId = generateSessionId();
    const sessionRef = doc(db, 'sessions', sessionId);

    // 1. Create Session
    const initialData = {
        sessionId,
        createdAt: serverTimestamp(),
        founderAName: "AI Partner",
        founderAEmail: "ai@example.com",
        answersA: {},
        founderBName: '',
        founderBEmail: '',
        answersB: {}
    };

    try {
        await setDoc(sessionRef, initialData);
        console.log("\n✅ Session Created Successfully!");
        console.log("=========================================");
        console.log(`👉 SESSION CODE:   ${sessionId}`);
        console.log("=========================================");
        console.log("⏳ Waiting for you (Founder B) to join...");

        let isPartnerJoined = false;
        let unsubscribe;

        // 2. Listen for Partner
        unsubscribe = onSnapshot(sessionRef, async (docSnap) => {
            const data = docSnap.data();
            if (!data) return;

            // Check if partner joined
            if (!isPartnerJoined && data.founderBName) {
                isPartnerJoined = true;
                console.log(`\n🎉 Partner Joined: ${data.founderBName}`);
                console.log("🚀 Starting to answer questions in 5 seconds...");

                setTimeout(() => startAnswering(sessionId), 5000);
            }

            // Optional: Log partner progress
            if (isPartnerJoined) {
                const bCount = Object.keys(data.answersB || {}).length;
                // process.stdout.write(`\rPartner Progress: ${bCount}/35`);
            }
        });

    } catch (error) {
        console.error("Error:", error);
    }
}

async function startAnswering(sessionId) {
    console.log("\n📝 AI is filling out the questionnaire...");
    const totalQuestions = 35; // From constants.tsx
    const answers = {};
    const sessionRef = doc(db, 'sessions', sessionId);

    for (let i = 0; i < totalQuestions; i++) {
        // AI answers randomly between 1-6
        const val = Math.floor(Math.random() * 6) + 1;
        answers[i] = val;

        // Update Firestore every few questions to simulate real-time
        if (i % 5 === 0 || i === totalQuestions - 1) {
            await updateDoc(sessionRef, { answersA: answers });
            console.log(`AI Progress: ${i + 1}/${totalQuestions}`);
            await new Promise(r => setTimeout(r, 800)); // Simulate think time
        }
    }

    // Ensure final save
    await updateDoc(sessionRef, { answersA: answers });
    console.log("\n✅ AI Finished!");
    console.log("👀 Check your screen for the Comparison View.");
    // Keep process alive for a bit
}

runSimulation();
