// Select elements from the DOM
const button = document.getElementById('clickMeBtn');
const messageParagraph = document.getElementById('message');

// Add an event listener to the button
button.addEventListener('click', () => {
    messageParagraph.textContent = 'Hello! You clicked the button.';
});