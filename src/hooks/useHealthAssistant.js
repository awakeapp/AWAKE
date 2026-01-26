import { useState, useRef, useCallback, useEffect } from 'react';
import { CreateMLCEngine } from '@mlc-ai/web-llm';

const SYSTEM_PROMPT = `You are a helpful and empathetic Health Guidance Assistant.
Your goal is to provide general wellness, fitness, and health information to help users lead a better lifestyle.

IMPORTANT GUIDELINES:
1. You must NEVER diagnose, prescribe, or offer definitive medical advice. 
2. If a user asks about specific symptoms or medical conditions, you MUST start your response with: "I am an AI assistant and cannot diagnose medical conditions. Please consult a qualified medical professional."
3. Keep your answers concise, supportive, and easy to understand.
4. Focus on general wellness (sleep, hydration, nutrition, stress management) rather than medical treatment.
`;

const SELECTED_MODEL = "Mistral-7B-Instruct-v0.2-q4f16_1-MLC";

export const useHealthAssistant = () => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hello! I'm here to help with general health and wellness guidance. How can I support you today?" }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [initProgress, setInitProgress] = useState('');
    const [isEngineReady, setIsEngineReady] = useState(false);

    // Ref to hold the engine instance so it doesn't re-init on renders
    const engineRef = useRef(null);

    const initializeEngine = useCallback(async () => {
        if (engineRef.current || isEngineReady) return;

        setIsLoading(true);
        setInitProgress('Initializing engine...');

        try {
            const engine = await CreateMLCEngine(
                SELECTED_MODEL,
                {
                    initProgressCallback: (report) => {
                        setInitProgress(report.text);
                    }
                }
            );
            engineRef.current = engine;
            setIsEngineReady(true);
            setInitProgress('');
        } catch (error) {
            console.error("Failed to load engine", error);
            setInitProgress('Error loading engine. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [isEngineReady]);

    const sendMessage = useCallback(async (text) => {
        if (!engineRef.current || !text.trim()) return;

        const userMsg = { role: 'user', content: text };

        // Optimistically update UI
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const history = [
                { role: 'system', content: SYSTEM_PROMPT },
                ...messages,
                userMsg
            ];

            const replyMsg = { role: 'assistant', content: '' };
            setMessages(prev => [...prev, replyMsg]);

            const chunks = await engineRef.current.chat.completions.create({
                messages: history,
                temperature: 0.7,
                stream: true,
            });

            let fullResponse = "";

            for await (const chunk of chunks) {
                const delta = chunk.choices[0]?.delta?.content || "";
                fullResponse += delta;

                // Update the last message with the growing response
                setMessages(prev => {
                    const newArr = [...prev];
                    const lastParams = newArr[newArr.length - 1];
                    // Ensure we are updating the assistant's placeholder
                    if (lastParams.role === 'assistant') {
                        lastParams.content = fullResponse;
                    }
                    return newArr;
                });
            }

        } catch (error) {
            console.error("Chat error", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    }, [messages]);

    return {
        messages,
        sendMessage,
        initializeEngine,
        isEngineReady,
        isLoading,
        initProgress
    };
};
