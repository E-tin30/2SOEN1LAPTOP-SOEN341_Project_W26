// Client-side login form handler - form submits traditionally to POST /login
(function() {
    const loginForm = document.getElementById('loginForm');
    const ErrorMessage = document.getElementById("response");

    if (!loginForm) return;

    loginForm.addEventListener('submit', function(e) {
        // Allow default form POST - server receives urlencoded body
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        ErrorMessage.textContent = ""; // Clears previous error
        ErrorMessage.classList.remove("show");
        if (!username || !password) {
            e.preventDefault();
            ErrorMessage.textContent = "Please enter both username and password";
            ErrorMessage.classList.add("show");
            return;
        }
    });
})();
