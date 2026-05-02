// ROLE SELECTION PAGE LOGIC
lucide.createIcons();

function selectRole(role) {
    localStorage.setItem('bb_selected_role', role);
    
    const cards = document.querySelectorAll('.landing-card');
    cards.forEach(card => card.style.opacity = '0.5');
    
    setTimeout(() => {
        if (role === 'seller') {
            window.location.href = 'login.html';
        } else if (role === 'admin') {
            window.location.href = 'admin-login.html';
        }
    }, 300);
}

const token = localStorage.getItem('token');
if (token) {
    window.location.href = 'index.html';
}