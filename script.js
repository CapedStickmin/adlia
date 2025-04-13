// script.js

// Add any JavaScript functionality here

document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

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

    // Function to get AI response using fetch
    async function getAIResponse(userMessage) {
        try {
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: userMessage
                        }]
                    }]
                })
            });

            const data = await response.json();
            if (data.candidates && data.candidates[0].content.parts[0].text) {
                return data.candidates[0].content.parts[0].text;
            } else {
                return "I apologize, but I couldn't generate a response. Please try again.";
            }
        } catch (error) {
            console.error('Error getting AI response:', error);
            return "I apologize, but I encountered an error. Please try again.";
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
                console.error('Error:', error);
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