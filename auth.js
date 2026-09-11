// Firebase Authentication logic for WeatherWise.

const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const forgotForm = document.getElementById('forgotForm');
const authSuccess = document.getElementById('authSuccess');
const authTabs = document.querySelectorAll('.auth-tab');
const strengthBar = document.getElementById('strengthBar');
const toastContainer = document.getElementById('toastContainer');

let firebaseAuth;
let authState = WeatherWiseAuthState.initialState;

document.addEventListener('DOMContentLoaded', () => {
    try {
        const firebaseConfig = window.WEATHERWISE_CONFIG?.firebase;
        if (!isFirebaseConfigUsable(firebaseConfig)) {
            throw new Error('Firebase is not configured. Add your Firebase web app settings to config.js.');
        }
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        firebaseAuth = firebase.auth();
        setupEventListeners();
        firebaseAuth.onAuthStateChanged(handleAuthStateChanged, () => {
            authState = WeatherWiseAuthState.reduceAuthState(authState, { type: 'AUTH_ERROR' });
            showToast(getAuthErrorMessage({ code: 'auth/network-request-failed' }), 'error');
        });
    } catch (error) {
        showToast('Authentication is temporarily unavailable. Please try again later.', 'error');
    }
});

function handleAuthStateChanged(user) {
    authState = WeatherWiseAuthState.reduceAuthState(authState, user
        ? { type: 'AUTHENTICATED', user }
        : { type: 'UNAUTHENTICATED' });
    if (WeatherWiseAuthState.isAuthenticated(authState)) window.location.href = 'index.html';
}

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
    if (!isValidEmail(email) || !password) return showToast('Enter a valid email address and password.', 'error');
    const submitBtn = setLoading(loginForm, 'Logging in...');
    try {
        await firebaseAuth.setPersistence(rememberMe ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION);
        const result = await firebaseAuth.signInWithEmailAndPassword(email, password);
        showSuccess('Welcome Back!', `Hello ${result.user.displayName || result.user.email}! Redirecting to your dashboard...`);
        setTimeout(goToApp, 1500);
    } catch (error) {
        showToast(getAuthErrorMessage(error), 'error');
        restoreButton(submitBtn);
    } finally {
        document.getElementById('loginPassword').value = '';
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
    if (!firstName || !lastName || !isValidEmail(email) || !password || !confirmPassword) return showToast('Complete all required fields with a valid email address.', 'error');
    if (password !== confirmPassword) return showToast('Passwords do not match', 'error');
    if (!isStrongPassword(password)) return showToast('Choose a stronger password with at least 8 characters, including uppercase, lowercase, and a number.', 'error');
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
    } finally {
        clearSignupPasswords();
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value.trim();
    if (!isValidEmail(email)) return showToast('Enter a valid email address.', 'error');
    const submitBtn = setLoading(forgotForm, 'Sending...');
    try {
        await firebaseAuth.sendPasswordResetEmail(email);
        showSuccess('Check Your Email', 'If an account exists with this email, you will receive a password reset link shortly.');
    } catch (error) {
        showToast(getAuthErrorMessage(error), 'error');
        restoreButton(submitBtn);
    } finally {
        document.getElementById('forgotEmail').value = '';
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
    const code = typeof error?.code === 'string' ? error.code : '';
    const locale = (document.documentElement.lang || navigator.language || 'en').split('-')[0];
    const messages = {
        en: { invalid: 'Invalid email or password.', exists: 'An account with this email already exists.', weak: 'Choose a stronger password.', email: 'Enter a valid email address.', many: 'Too many attempts. Please try again later.', network: 'Network error. Check your connection and try again.', disabled: 'This account has been disabled. Contact support.', unavailable: 'Authentication is temporarily unavailable. Please try again later.' },
        es: { invalid: 'El correo o la contraseña no son válidos.', exists: 'Ya existe una cuenta con este correo.', weak: 'Elige una contraseña más segura.', email: 'Introduce un correo válido.', many: 'Demasiados intentos. Inténtalo más tarde.', network: 'Error de red. Comprueba tu conexión e inténtalo de nuevo.', disabled: 'Esta cuenta está deshabilitada. Contacta con soporte.', unavailable: 'La autenticación no está disponible temporalmente. Inténtalo más tarde.' }
    };
    const text = messages[locale] || messages.en;
    if (code === 'auth/invalid-email') return text.email;
    if (code === 'auth/email-already-in-use') return text.exists;
    if (code === 'auth/weak-password') return text.weak;
    if (code === 'auth/too-many-requests') return text.many;
    if (code === 'auth/network-request-failed') return text.network;
    if (code === 'auth/user-disabled') return text.disabled;
    if (['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password'].includes(code)) return text.invalid;
    return text.unavailable;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isFirebaseConfigUsable(config) {
    const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
    return Boolean(config) && requiredKeys.every(key => {
        const value = config[key];
        return typeof value === 'string' && value.trim() && !value.startsWith('your-');
    });
}

function isStrongPassword(password) {
    return password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
}

function clearSignupPasswords() {
    ['signupPassword', 'confirmPassword'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });
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
    const icon = document.createElement('i');
    icon.className = `fas ${icons[type]}`;
    const text = document.createElement('span');
    text.textContent = message;
    toast.replaceChildren(icon, text);
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
