function  validateForm(event){
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    const EmailInput = document.getElementById('username');
    const ErrorMessage = document.getElementById("ErrorMessage");
    ErrorMessage.textContent = ""; // Clears previous error

    if(!username || !password || !confirmPassword){
        event.preventDefault();
        ErrorMessage.textContent = "Please fill all the fields."
        return;
    }

    /* Printing our own error Message */
    if(!EmailInput.checkValidity())
        {
            event.preventDefault();
            ErrorMessage.textContent = "Invalid Email! Must include @!";
            EmailInput.focus();
            return;
        }
    // Outputs our own error Message
    if(password !== confirmPassword){
        event.preventDefault();
        ErrorMessage.textContent = "Passwords do not match!"
        return;
    }

    // Passwords must be at least 5 characters, have at least 1 letter and have at least 1 digit
    const validChars = /^[a-zA-Z0-9]{5,}$/;
    const hasLetter = /[a-zA-Z]/;
    const hasDigit = /\d/; 

    if (!validChars.test(password) || !hasLetter.test(password) || !hasDigit.test(password)){
        event.preventDefault();
        ErrorMessage.textContent = "Passwords must be at least 5 characters, have at least 1 letter and have at least 1 digit!"
        return;
    }
}