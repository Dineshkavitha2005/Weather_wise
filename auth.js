// Firebase Authentication logic for WeatherWise.

const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const forgotForm = document.getElementById('forgotForm');
const authSuccess = document.getElementById('authSuccess');
const authTabs = document.querySelectorAll('.auth-tab');
const strengthBar = document.getElementById('strengthBar');
const toastContainer = document.getElementById('toastContainer');

let firebaseAuth;

document.addEventListener('DOMContentLoaded', () => {
    try {
        const firebaseConfig = window.WEATHERWISE_CONFIG?.firebase;
        if (!firebaseConfig || firebaseConfig.apiKey === 'your-firebase-api-key') {
            throw new Error('Firebase is not configured. Add your Firebase web app settings to config.js.');
        }
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        firebaseAuth = firebase.auth();
        setupEventListeners();
        firebaseAuth.onAuthStateChanged(user => {
            if (user) window.location.href = 'index.html';
        });
    } catch (error) {
        showToast(error.message, 'error');
    }
});

function setupEventListeners() {
    authTabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    forgotForm.addEventListener('submit', handleForgotPassword);
    const signupPassword = document.getElementById('signupPassword');
    if (signupPassword) signupPassword.addEventListener('input', checkPasswordStrength);
    const confirmPassword = document.getElementById('confirmPassword');
    if (confirmPassword) confirmPassword.addEventListener('input', validateConfirmPassword);
}

function switchTab(tab) {
    authTabs.forEach(item => item.classList.toggle('active', item.dataset.tab === tab));
    loginForm.classList.toggle('active', tab === 'login');
    signupForm.classList.toggle('active', tab === 'signup');
    forgotForm.classList.remove('active');
    authSuccess.classList.remove('active');
}

function showForgotPassword() {
    loginForm.classList.remove('active');
    signupForm.classList.remove('active');
    forgotForm.classList.add('active');
    authSuccess.classList.remove('active');
}

function showLoginForm() {
    forgotForm.classList.remove('active');
    loginForm.classList.add('active');
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.toggle-password i');
    const visible = input.type === 'text';
    input.type = visible ? 'password' : 'text';
    button.classList.toggle('fa-eye', visible);
    button.classList.toggle('fa-eye-slash', !visible);
}

function checkPasswordStrength(e) {
    const password = e.target.value;
    const strengthContainer = document.querySelector('.password-strength');
    let strength = 0;
    strengthContainer.classList.toggle('active', password.length > 0);
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    strengthBar.className = 'strength-bar';
    if (password.length === 0) strengthBar.style.width = '0';
    else if (strength <= 2) strengthBar.classList.add('weak');
    else if (strength <= 4) strengthBar.classList.add('medium');
    else strengthBar.classList.add('strong');
}

function validateConfirmPassword(e) {
    const password = document.getElementById('signupPassword').value;
    e.target.style.borderColor = e.target.value && password !== e.target.value ? 'var(--danger)' : '';
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    if (!email || !password) return showToast('Please fill in all fields', 'error');
    const submitBtn = setLoading(loginForm, 'Logging in...');
    try {
        await firebaseAuth.setPersistence(rememberMe ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION);
        const result = await firebaseAuth.signInWithEmailAndPassword(email, password);
        showSuccess('Welcome Back!', `Hello ${result.user.displayName || result.user.email}! Redirecting to your dashboard...`);
        setTimeout(goToApp, 1500);
    } catch (error) {
        showToast(getAuthErrorMessage(error), 'error');
        restoreButton(submitBtn);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    if (!firstName || !lastName || !email || !password || !confirmPassword) return showToast('Please fill in all required fields', 'error');
    if (password !== confirmPassword) return showToast('Passwords do not match', 'error');
    if (password.length < 8) return showToast('Password must be at least 8 characters', 'error');
    if (!agreeTerms) return showToast('Please agree to the Terms of Service', 'error');
    const submitBtn = setLoading(signupForm, 'Creating account...');
    try {
        await firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        const result = await firebaseAuth.createUserWithEmailAndPassword(email, password);
        await result.user.updateProfile({ displayName: `${firstName} ${lastName}` });
        showSuccess('Account Created!', `Welcome ${firstName}! Your account has been created successfully.`);
        setTimeout(goToApp, 1500);
    } catch (error) {
        showToast(getAuthErrorMessage(error), 'error');
        restoreButton(submitBtn);
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value.trim();
    if (!email) return showToast('Please enter your email address', 'error');
    const submitBtn = setLoading(forgotForm, 'Sending...');
    try {
        await firebaseAuth.sendPasswordResetEmail(email);
        showSuccess('Check Your Email', 'If an account exists with this email, you will receive a password reset link shortly.');
    } catch (error) {
        showToast(getAuthErrorMessage(error), 'error');
        restoreButton(submitBtn);
    }
}

function socialLogin(provider) {
    showToast(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login is not configured yet.`, 'info');
}

function setLoading(form, label) {
    const button = form.querySelector('button[type="submit"]');
    button.dataset.originalHtml = button.innerHTML;
    button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${label}`;
    button.disabled = true;
    return button;
}

function restoreButton(button) {
    button.innerHTML = button.dataset.originalHtml;
    button.disabled = false;
}

function getAuthErrorMessage(error) {
    const messages = {
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/user-not-found': 'Invalid email or password.',
        'auth/wrong-password': 'Invalid email or password.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Choose a stronger password.',
        'auth/invalid-email': 'Enter a valid email address.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.'
    };
    return messages[error.code] || 'Authentication failed. Please try again.';
}

function showSuccess(title, message) {
    document.getElementById('successTitle').textContent = title;
    document.getElementById('successMessage').textContent = message;
    loginForm.classList.remove('active');
    signupForm.classList.remove('active');
    forgotForm.classList.remove('active');
    authSuccess.classList.add('active');
    document.querySelector('.auth-tabs').style.display = 'none';
}

function goToApp() { window.location.href = 'index.html'; }

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    toast.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

window.togglePassword = togglePassword;
window.showForgotPassword = showForgotPassword;
window.showLoginForm = showLoginForm;
window.socialLogin = socialLogin;
window.goToApp = goToApp;
