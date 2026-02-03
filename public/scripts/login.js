// Client-side login form handler - form submits traditionally to POST /login
(function() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', function(e) {
        // Allow default form POST - server receives urlencoded body
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        if (!username || !password) {
            e.preventDefault();
            alert('Please enter both username and password');
            return;
        }
    });
})();
