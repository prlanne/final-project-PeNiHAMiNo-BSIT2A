// AUTHENTICATION & API SETUP
const API_BASE_URL = 'http://localhost:3000/api';
const AUTH_API_URL = 'http://localhost:3000/api/users';

// Store registration data temporarily
let pendingRegistration = {
    full_name: '',
    username: '',
    email: '',
    password: ''
};

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

// STEP 1: Send verification code
async function handleSignupStep1(e) {
    e.preventDefault();
    
    const full_name = document.getElementById('regName').value.trim();
    const username = document.getElementById('regUser').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPass').value;

    // Validate Gmail
    if (!email.toLowerCase().endsWith('@gmail.com')) {
        bentaNotify.show('warning', 'GMAIL REQUIRED', 'Please use a valid Gmail address (@gmail.com).');
        return;
    }

    // Validate password length
    if (password.length < 6) {
        bentaNotify.show('warning', 'PASSWORD', 'Password must be at least 6 characters.');
        return;
    }

    // Store data for later
    pendingRegistration = { full_name, username, email, password };

    // Show loading
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Sending Code...';

    try {
        const response = await fetch(`${API_BASE_URL}/verify/send-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, full_name, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Show verification step
            document.getElementById('signupForm').style.display = 'none';
            document.getElementById('verifyForm').style.display = 'block';
            document.getElementById('verifiedEmailDisplay').style.display = 'block';
            document.getElementById('sentEmailDisplay').textContent = email;
            document.getElementById('formTitle').textContent = 'Verify Email';
            document.getElementById('formSubtitle').textContent = 'Enter the code sent to your Gmail';
            
            // Update step indicator
            document.getElementById('step1Dot').classList.remove('active');
            document.getElementById('step1Dot').classList.add('completed');
            document.getElementById('stepLine').classList.add('completed');
            document.getElementById('step2Dot').classList.remove('inactive');
            document.getElementById('step2Dot').classList.add('active');
            
            // Show resend button after 5 seconds
            setTimeout(() => {
                document.getElementById('resendBtn').style.display = 'block';
            }, 5000);

            bentaNotify.show('success', 'CODE SENT', 'Verification code sent to your Gmail!');
            
            // Auto-focus the verification input
            setTimeout(() => {
                document.getElementById('verifyCode').focus();
            }, 500);

        } else {
            bentaNotify.show('error', 'ERROR', data.msg || 'Failed to send verification code.');
        }
    } catch (err) {
        console.error('Send code error:', err);
        bentaNotify.show('error', 'ERROR', 'Connection failed. Please check your internet connection.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="mail" style="width: 18px; height: 18px;"></i> Send Verification Code';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// STEP 2: Verify code and create account
async function handleVerifyCode(e) {
    e.preventDefault();

    const code = document.getElementById('verifyCode').value.trim();

    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
        bentaNotify.show('warning', 'INVALID CODE', 'Please enter a valid 6-digit verification code.');
        return;
    }

    const verifyBtn = document.getElementById('verifyBtn');
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Verifying...';

    try {
        const response = await fetch(`${API_BASE_URL}/verify/check-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: pendingRegistration.email,
                code: code
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Save token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('bb_user', data.user.username);
            localStorage.setItem('bb_welcome_triggered', 'true');

            bentaNotify.show('success', 'SUCCESS', 'Account created! Redirecting...', () => {
                window.location.href = 'index.html';
            });
        } else {
            bentaNotify.show('error', 'ERROR', data.msg || 'Invalid or expired verification code.');
        }
    } catch (err) {
        console.error('Verify code error:', err);
        bentaNotify.show('error', 'ERROR', 'Connection failed. Please try again.');
    } finally {
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = '<i data-lucide="shield-check" style="width: 18px; height: 18px;"></i> Verify & Create Account';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// Go back to signup form
function goBackToSignup() {
    document.getElementById('signupForm').style.display = 'block';
    document.getElementById('verifyForm').style.display = 'none';
    document.getElementById('formTitle').textContent = 'Create Account';
    document.getElementById('formSubtitle').textContent = 'Get started with BentaBoard';
    
    // Update step indicator
    document.getElementById('step1Dot').classList.add('active');
    document.getElementById('step1Dot').classList.remove('completed');
    document.getElementById('stepLine').classList.remove('completed');
    document.getElementById('step2Dot').classList.add('inactive');
    document.getElementById('step2Dot').classList.remove('active');
    document.getElementById('resendBtn').style.display = 'none';
}

// Resend verification code
async function resendCode() {
    const resendBtn = document.getElementById('resendBtn');
    resendBtn.disabled = true;
    resendBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Resending...';

    try {
        const response = await fetch(`${API_BASE_URL}/verify/send-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pendingRegistration)
        });

        const data = await response.json();

        if (response.ok) {
            bentaNotify.show('success', 'CODE RESENT', 'New verification code sent to your Gmail!');
            document.getElementById('verifyCode').value = '';
            document.getElementById('verifyCode').focus();
            
            // Hide resend button for 5 seconds
            resendBtn.style.display = 'none';
            setTimeout(() => {
                resendBtn.style.display = 'block';
            }, 5000);
        } else {
            bentaNotify.show('error', 'ERROR', data.msg || 'Failed to resend code.');
        }
    } catch (err) {
        bentaNotify.show('error', 'ERROR', 'Connection failed.');
    } finally {
        resendBtn.disabled = false;
        resendBtn.innerHTML = '<i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i> Resend Code';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// Original login handler (unchanged)
async function handleAuth(e, type) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    if (type === 'login') {
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

// Admin login handler
async function handleAdminAuth(e, type) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    if (type === 'login') {
        const loginData = {
            username: formData.get('loginUser'),
            password: formData.get('loginPass')
        };
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('bb_user', data.user.username);
                localStorage.setItem('bb_role', 'admin');
                window.location.href = 'admin-dashboard.html';
            } else {
                bentaNotify.show('error', 'ERROR', data.msg || 'Invalid admin credentials');
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
                popup: 'bb-modal-popup',
                confirmButton: 'bb-btn-primary',
                actions: 'bb-modal-actions'
            },
            buttonsStyling: false,
            showClass: { popup: 'swal2-show', backdrop: 'swal2-backdrop-show' },
            hideClass: { popup: 'swal2-hide', backdrop: 'swal2-backdrop-hide' }
        }).then(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('bb_user');
            window.location.replace('login.html');
        });
    });
}