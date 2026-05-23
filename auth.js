// auth.js - Authentication Logic for WeatherWise
// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const forgotForm = document.getElementById('forgotForm');
const authSuccess = document.getElementById('authSuccess');
const authTabs = document.querySelectorAll('.auth-tab');
const strengthBar = document.getElementById('strengthBar');
const toastContainer = document.getElementById('toastContainer');
// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkExistingSession();
});
// Setup Event Listeners
function setupEventListeners() {
    // Tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // Form submissions
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    forgotForm.addEventListener('submit', handleForgotPassword);
    
    // Password strength checker
    const signupPassword = document.getElementById('signupPassword');
    if (signupPassword) {
        signupPassword.addEventListener('input', checkPasswordStrength);
    }
    
    // Confirm password validation
    const confirmPassword = document.getElementById('confirmPassword');
    if (confirmPassword) {
        confirmPassword.addEventListener('input', validateConfirmPassword);
    }
}

// Check for existing session
function checkExistingSession() {
    const user = JSON.parse(localStorage.getItem('weatherwise_user'));
    if (user && user.isLoggedIn) {
        // Redirect to main app if already logged in
        window.location.href = 'index.html';
    }
}

// Switch between login and signup tabs
function switchTab(tab) {
    // Update tabs
    authTabs.forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    
    // Hide all forms
    loginForm.classList.remove('active');
    signupForm.classList.remove('active');
    forgotForm.classList.remove('active');
    authSuccess.classList.remove('active');
    
    // Show selected form
    if (tab === 'login') {
        loginForm.classList.add('active');
    } else if (tab === 'signup') {
        signupForm.classList.add('active');
    }
}

// Show forgot password form
function showForgotPassword() {
    loginForm.classList.remove('active');
    signupForm.classList.remove('active');
    forgotForm.classList.add('active');
    authSuccess.classList.remove('active');
}

// Show login form (back from forgot password)
function showLoginForm() {
    forgotForm.classList.remove('active');
    loginForm.classList.add('active');
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.toggle-password i');
    
    if (input.type === 'password') {
        input.type = 'text';
        button.classList.remove('fa-eye');
        button.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        button.classList.remove('fa-eye-slash');
        button.classList.add('fa-eye');
    }
}

// Check password strength
function checkPasswordStrength(e) {
    const password = e.target.value;
    const strengthContainer = document.querySelector('.password-strength');
    let strength = 0;
    
    // Show/hide strength bar container
    if (password.length > 0) {
        strengthContainer.classList.add('active');
    } else {
        strengthContainer.classList.remove('active');
    }
    
    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) strength++;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength++;
    
    // Contains numbers
    if (/[0-9]/.test(password)) strength++;
    
    // Contains special characters
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    // Update strength bar
    strengthBar.className = 'strength-bar';
    if (password.length === 0) {
        strengthBar.style.width = '0';
    } else if (strength <= 2) {
        strengthBar.classList.add('weak');
    } else if (strength <= 4) {
        strengthBar.classList.add('medium');
    } else {
        strengthBar.classList.add('strong');
    }
}

// Validate confirm password
function validateConfirmPassword(e) {
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = e.target.value;
    
    if (confirmPassword && password !== confirmPassword) {
        e.target.style.borderColor = 'var(--danger)';
    } else {
        e.target.style.borderColor = '';
    }
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Validate
    if (!email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    // Show loading
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    submitBtn.disabled = true;
    
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check stored users
        const users = JSON.parse(localStorage.getItem('weatherwise_users')) || [];
        const user = users.find(u => u.email === email);
        
        if (!user) {
            throw new Error('User not found. Please sign up first.');
        }
        
        if (user.password !== btoa(password)) {
            throw new Error('Invalid password. Please try again.');
        }
        
        // Save session
        const sessionUser = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            defaultCity: user.defaultCity,
            isLoggedIn: true,
            loginTime: new Date().toISOString()
        };
        
        if (rememberMe) {
            localStorage.setItem('weatherwise_user', JSON.stringify(sessionUser));
        } else {
            sessionStorage.setItem('weatherwise_user', JSON.stringify(sessionUser));
        }
        
        // Show success
        showSuccess('Welcome Back!', `Hello ${user.firstName}! Redirecting to your dashboard...`);
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        showToast(error.message, 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Handle Sign Up
async function handleSignup(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const defaultCity = document.getElementById('defaultCity').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    const newsletter = document.getElementById('newsletter').checked;
    
    // Validate
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
    }
    
    if (!agreeTerms) {
        showToast('Please agree to the Terms of Service', 'error');
        return;
    }
    
    // Show loading
    const submitBtn = signupForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    submitBtn.disabled = true;
    
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check if user exists
        const users = JSON.parse(localStorage.getItem('weatherwise_users')) || [];
        if (users.find(u => u.email === email)) {
            throw new Error('An account with this email already exists.');
        }
        
        // Create new user
        const newUser = {
            id: Date.now().toString(),
            firstName,
            lastName,
            email,
            password: btoa(password), // In production, use proper hashing
            defaultCity,
            newsletter,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('weatherwise_users', JSON.stringify(users));
        
        // Auto login
        const sessionUser = {
            id: newUser.id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            defaultCity: newUser.defaultCity,
            isLoggedIn: true,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('weatherwise_user', JSON.stringify(sessionUser));
        
        // Show success
        showSuccess('Account Created!', `Welcome ${firstName}! Your account has been created successfully.`);
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2500);
        
    } catch (error) {
        showToast(error.message, 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Handle Forgot Password
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgotEmail').value;
    
    if (!email) {
        showToast('Please enter your email address', 'error');
        return;
    }
    
    // Show loading
    const submitBtn = forgotForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;
    
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check if user exists
        const users = JSON.parse(localStorage.getItem('weatherwise_users')) || [];
        const user = users.find(u => u.email === email);
        
        // Always show success (for security, don't reveal if email exists)
        showSuccess('Check Your Email', 'If an account exists with this email, you will receive a password reset link shortly.');
        
    } catch (error) {
        showToast('Something went wrong. Please try again.', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Social Login
function socialLogin(provider) {
    showToast(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login coming soon!`, 'info');
}

// Show Success
function showSuccess(title, message) {
    document.getElementById('successTitle').textContent = title;
    document.getElementById('successMessage').textContent = message;
    
    loginForm.classList.remove('active');
    signupForm.classList.remove('active');
    forgotForm.classList.remove('active');
    authSuccess.classList.add('active');
    
    // Hide tabs
    document.querySelector('.auth-tabs').style.display = 'none';
}

// Go to App
function goToApp() {
    window.location.href = 'index.html';
}

// Show Toast
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Export functions for global access
window.togglePassword = togglePassword;
window.showForgotPassword = showForgotPassword;
window.showLoginForm = showLoginForm;
window.socialLogin = socialLogin;
window.goToApp = goToApp;
