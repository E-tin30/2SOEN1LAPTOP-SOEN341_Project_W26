const deleteForms = document.querySelectorAll('.deleteBtn');

deleteForms.forEach(button => {
    button.addEventListener('click', (e) => {
        const confirmDelete = confirm("Are you sure you want to delete this recipe?");
        if (!confirmDelete) {
            e.preventDefault();
        }
    });
});

// Auto-dismiss flash message
const flash = document.querySelector('.flash-message');

if (flash) {
    setTimeout(() => {
        flash.style.transition = "opacity 0.4s ease";
        flash.style.opacity = "0";

        setTimeout(() => {
            flash.remove();
        }, 400);
    }, 3000);
}