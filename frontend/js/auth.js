// AUTHENTICATION & API SETUP 
const API_BASE_URL = 'http://localhost:3000/api';
const AUTH_API_URL = 'http://localhost:3000/api/users';

function getUserIdFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return 'guest';
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id || 'guest';
    } catch { return 'guest'; }
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

async function handleAuth(e, type) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    if (type === 'signup') {
        const userData = {
            full_name: formData.get('regName'),
            username:  formData.get('regUser'),
            email:     formData.get('regEmail'),
            password:  formData.get('regPass'),
            role:      "Seller"
        };
        try {
            const response = await fetch(`${AUTH_API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await response.json();
            if (response.ok) {
                bentaNotify.show('success', 'SUCCESS', 'Account created! Redirecting to login...', () => {
                    window.location.href = 'login.html';
                });
                form.reset();
            } else {
                bentaNotify.show('error', 'ERROR', data.msg || data.error || 'User already exists');
            }
        } catch (err) {
            bentaNotify.show('error', 'ERROR', 'Connection failed. Is your backend server running on port 3000?');
        }
    } else {
        const loginData = {
            username: formData.get('loginUser'),
            password: formData.get('loginPass')
        };
        try {
            const response = await fetch(`${AUTH_API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('bb_user', data.user.username);
                localStorage.setItem('bb_welcome_triggered', 'true');
                window.location.href = 'index.html';
            } else {
                bentaNotify.show('error', 'ERROR', data.msg || 'Invalid credentials');
            }
        } catch (err) {
            bentaNotify.show('error', 'ERROR', 'Could not connect to the server.');
        }
    }
}

// LOGOUT 
function executeLogout(e) {
    if(e) e.preventDefault();
    bentaNotify.confirm('Sign Out?', 'Are you sure you want to logout of BentaBoard?', 'Logout', () => {
        Swal.fire({
            html: `
                <div class="bb-modal-icon bb-success">${_bbIcons.success}</div>
                <p class="bb-modal-title">THANK YOU!</p>
                <p class="bb-modal-body">Thank you for using BentaBoard! We look forward to seeing you again.</p>
            `,
            showConfirmButton: true,
            confirmButtonText: 'CONTINUE',
            customClass: {
                popup:         'bb-modal-popup',
                confirmButton: 'bb-btn-primary',
                actions:       'bb-modal-actions'
            },
            buttonsStyling: false,
            showClass:  { popup: 'swal2-show', backdrop: 'swal2-backdrop-show' },
            hideClass:  { popup: 'swal2-hide', backdrop: 'swal2-backdrop-hide' }
        }).then(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('bb_user');
            window.location.replace('login.html');
        });
    });
}