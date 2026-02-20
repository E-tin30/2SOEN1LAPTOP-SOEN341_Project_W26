const deleteForms = document.querySelectorAll('.deleteBtn');

deleteForms.forEach(button => {
    button.addEventListener('click', (e) => {
        const confirmDelete = confirm("Are you sure you want to delete this recipe?");
        if (!confirmDelete) {
            e.preventDefault();
        }
    });
});