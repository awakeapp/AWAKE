import { createContext, useContext, useState, useEffect } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    orderBy,
    serverTimestamp,
    setDoc,
    doc,
    getDocs,
    updateDoc,
    arrayUnion
} from 'firebase/firestore';

const ChatContext = createContext();

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatContextProvider');
    }
    return context;
};

export const ChatContextProvider = ({ children }) => {
    const { user } = useAuthContext();
    const [messages, setMessages] = useState([]);
    const [coupleId, setCoupleId] = useState(null);
    const [partner, setPartner] = useState(null);
    const [pairingCode, setPairingCode] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isMock] = useState(() => db.mock === true);

    // MOCK DATA STORAGE (Local Storage)
    const MOCK_STORAGE_KEY_COUPLE = 'awake_mock_couple';
    const MOCK_STORAGE_KEY_MESSAGES = 'awake_mock_messages';

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        if (isMock) {
            // Load Mock Couple
            const storedCouple = localStorage.getItem(MOCK_STORAGE_KEY_COUPLE);
            if (storedCouple) {
                const couple = JSON.parse(storedCouple);
                if (couple.users.includes(user.uid)) {
                    setCoupleId(couple.id);
                    // Mock Partner
                    setPartner({ uid: 'mock-partner', email: 'partner@example.com' });
                }
            }
            setLoading(false);
            return;
        }

        // REAL FIRESTORE: Find couple where user is a member
        const q = query(
            collection(db, 'couples'),
            where('users', 'array-contains', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const coupleDoc = snapshot.docs[0];
                setCoupleId(coupleDoc.id);
                // In real app, we'd fetch partner profile. For now, just store ID.
                const otherUserId = coupleDoc.data().users.find(u => u !== user.uid);
                setPartner({ uid: otherUserId || 'waiting', email: 'Partner' });
            } else {
                setCoupleId(null);
                setPartner(null);
            }
            setLoading(false);
        }, (err) => {
            console.error("Chat sync error:", err);
            setLoading(false);
        });

        return () => unsubscribe();

    }, [user, isMock]);

    // Listen for Messages
    useEffect(() => {
        if (!coupleId) {
            setMessages([]);
            return;
        }

        if (isMock) {
            const loadMockMessages = () => {
                const stored = localStorage.getItem(MOCK_STORAGE_KEY_MESSAGES);
                if (stored) {
                    setMessages(JSON.parse(stored));
                }
            };
            loadMockMessages();
            window.addEventListener('storage', loadMockMessages); // Listen for changes
            return () => window.removeEventListener('storage', loadMockMessages);
        }

        // Real Firestore Messages
        const q = query(
            collection(db, `couples/${coupleId}/messages`),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [coupleId, isMock]);


    // ACTIONS

    const generateCode = async () => {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        if (isMock) {
            setPairingCode(code);
            // In mock, we wait for "join" simulation
            return code;
        }

        // Create a 'pairing_codes' doc
        await setDoc(doc(db, 'pairing_codes', code), {
            createdBy: user.uid,
            createdAt: serverTimestamp()
        });
        setPairingCode(code);
        return code;
    };

    const joinWithCode = async (code) => {
        if (isMock) {
            // Mock connection success unconditionally if code matches (or just any code for demo)
            if (code) {
                const newCouple = {
                    id: 'mock-couple-id',
                    users: [user.uid, 'mock-owner-id']
                };
                localStorage.setItem(MOCK_STORAGE_KEY_COUPLE, JSON.stringify(newCouple));
                setCoupleId(newCouple.id);
                setPartner({ uid: 'mock-partner', email: 'Partner' });
                return true;
            }
            return false;
        }

        // Validate Code
        const codeRef = doc(db, 'pairing_codes', code);
        const codeSnap = await getDocs(query(collection(db, 'pairing_codes'), where('__name__', '==', code)));

        if (codeSnap.empty) {
            throw new Error("Invalid Code");
        }

        const codeData = codeSnap.docs[0].data();
        if (codeData.createdBy === user.uid) {
            throw new Error("You cannot join your own code.");
        }

        // Create Couple
        const newCoupleRef = await addDoc(collection(db, 'couples'), {
            users: [codeData.createdBy, user.uid],
            createdAt: serverTimestamp(),
            status: 'active'
        });

        // Cleanup code
        // await deleteDoc(doc(db, 'pairing_codes', code)); // skip for now

        return true;
    };

    const sendMessage = async (text) => {
        if (!text.trim()) return;

        const newMessage = {
            text,
            senderId: user.uid,
            createdAt: isMock ? new Date().toISOString() : serverTimestamp(),
            status: 'sent'
        };

        if (isMock) {
            const currentMsgs = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY_MESSAGES) || '[]');
            currentMsgs.push({ id: `msg_${Date.now()}`, ...newMessage });
            localStorage.setItem(MOCK_STORAGE_KEY_MESSAGES, JSON.stringify(currentMsgs));
            setMessages(currentMsgs);

            // SIMULATE REPLY
            setTimeout(() => {
                const reply = {
                    text: ["Love you too!", "Okay, see you!", "Don't forget water!", "Good night <3"][Math.floor(Math.random() * 4)],
                    senderId: 'mock-partner',
                    createdAt: new Date().toISOString(),
                    status: 'sent'
                };
                currentMsgs.push({ id: `msg_${Date.now()}_reply`, ...reply });
                localStorage.setItem(MOCK_STORAGE_KEY_MESSAGES, JSON.stringify(currentMsgs));
                setMessages([...currentMsgs]);
            }, 3000);

            return;
        }

        await addDoc(collection(db, `couples/${coupleId}/messages`), newMessage);
    };

    const value = {
        messages,
        coupleId,
        partner,
        loading,
        pairingCode,
        generateCode,
        joinWithCode,
        sendMessage,
        isMock
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};
