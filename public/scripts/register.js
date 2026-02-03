function  validateForm(event){
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    if(!username || !password || !confirmPassword){
        event.preventDefault();
        alert('All fields are required. Please fill in all fields.');
        return;
    }

    if(password !== confirmPassword){
        event.preventDefault();
        alert('Passwords do not match.');
        return;
    }
    
    // // Username can only have letter and digits
    // const usernameRegex = /^[a-zA-Z0-9]+$/;

    // Passwords must be at least 5 characters, have at least 1 letter and have at least 1 digit
    const validChars = /^[a-zA-Z0-9]{5,}$/;
    const hasLetter = /[a-zA-Z]/;
    const hasDigit = /\d/;

    // if (!usernameRegex.test(username)){
    //     event.preventDefault();
    //     alert('Username can only contain letters and digits. Try again.');
    //     return;
    // }

    if (!validChars.test(password) || !hasLetter.test(password) || !hasDigit.test(password)){
        event.preventDefault();
        alert('Password rules were not followed. Try again.');
        return;
    }
}