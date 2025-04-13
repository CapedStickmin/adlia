// script.js

// Add any JavaScript functionality here

document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    let genAI;
    let model;

    try {
        // Initialize the Gemini API
        genAI = new window.GoogleGenerativeAI(window.config.apiKey);
        model = genAI.getGenerativeModel({ model: "gemini-pro" });
        console.log('Gemini API initialized successfully');
    } catch (error) {
        console.error('Error initializing Gemini API:', error);
    }

    // Function to add a message to the chat
    function addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Add welcome message
    addMessage("Hello! I'm ADIL, your AI assistant. I'm here to help you with any questions or tasks you might have. How can I assist you today?");

    // Function to get AI response
    async function getAIResponse(userMessage) {
        if (!model) {
            throw new Error('Gemini API not initialized');
        }

        try {
            console.log('Sending message to Gemini:', userMessage);
            const result = await model.generateContent(userMessage);
            console.log('Received response from Gemini');
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Error getting AI response:', error);
            throw error;
        }
    }

    // Function to handle user input
    async function handleUserInput() {
        const message = userInput.value.trim();
        if (message) {
            // Disable input while processing
            userInput.disabled = true;
            sendButton.disabled = true;

            // Add user message to chat
            addMessage(message, true);
            userInput.value = '';

            try {
                // Get and display AI response
                const response = await getAIResponse(message);
                addMessage(response);
            } catch (error) {
                console.error('Error in handleUserInput:', error);
                addMessage("I apologize, but I encountered an error. Please try again.");
            } finally {
                // Re-enable input
                userInput.disabled = false;
                sendButton.disabled = false;
                userInput.focus();
            }
        }
    }

    // Event listeners
    sendButton.addEventListener('click', handleUserInput);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleUserInput();
        }
    });

    // Focus input on load
    userInput.focus();
}); 