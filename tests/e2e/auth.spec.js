const { test, expect } = require('@playwright/test');

const firebaseMock = `
(function () {
    const users = { 'test@example.com': { uid: 'test-user', email: 'test@example.com', displayName: 'Test User' } };
    let currentUser = null;
    const callbacks = [];
    const persistenceKey = 'firebase:authUser';
    const readStoredUser = () => {
        const raw = localStorage.getItem(persistenceKey) || sessionStorage.getItem(persistenceKey);
        return raw ? JSON.parse(raw) : null;
    };
    const notify = () => callbacks.forEach(callback => callback(currentUser));
    const auth = {
        setPersistence: async persistence => { auth.persistence = persistence; },
        onAuthStateChanged: (callback, onError) => { callbacks.push(callback); setTimeout(() => callback(currentUser || readStoredUser()), 0); return () => callbacks.splice(callbacks.indexOf(callback), 1); },
        signInWithEmailAndPassword: async (email, password) => {
            if (email !== 'test@example.com' || password !== 'CorrectPassword1') throw { code: 'auth/wrong-password' };
            currentUser = users[email];
            (auth.persistence === 'session' ? sessionStorage : localStorage).setItem(persistenceKey, JSON.stringify(currentUser));
            notify();
            return { user: currentUser };
        },
        createUserWithEmailAndPassword: async (email, password) => {
            if (users[email]) throw { code: 'auth/email-already-in-use' };
            if (password.length < 8) throw { code: 'auth/weak-password' };
            currentUser = { uid: 'new-user', email, displayName: null };
            users[email] = currentUser;
            localStorage.setItem(persistenceKey, JSON.stringify(currentUser));
            notify();
            return { user: { ...currentUser, updateProfile: async profile => { currentUser.displayName = profile.displayName; } } };
        },
        sendPasswordResetEmail: async email => { if (email === 'bad-email') throw { code: 'auth/invalid-email' }; },
        signOut: async () => { currentUser = null; localStorage.removeItem(persistenceKey); sessionStorage.removeItem(persistenceKey); notify(); }
    };
    window.firebase = { apps: [], initializeApp: () => window.firebase.apps.push({}), auth: () => auth };
    window.firebase.auth.Auth = { Persistence: { LOCAL: 'local', SESSION: 'session' } };
}());`;

async function mockFirebase(page) {
    await page.route('**/config.js', route => route.fulfill({ contentType: 'application/javascript', body: `window.WEATHERWISE_CONFIG = { openWeatherApiKey: 'test', openAiApiKey: 'test', firebase: { apiKey: 'test', authDomain: 'test.firebaseapp.com', projectId: 'test', appId: 'test' } };` }));
    await page.route('**/firebase-app-compat.js', route => route.fulfill({ contentType: 'application/javascript', body: firebaseMock }));
    await page.route('**/firebase-auth-compat.js', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
}

test.describe('Firebase authentication', () => {
    test('signs up a new user', async ({ page }) => {
        await mockFirebase(page);
        await page.goto('/auth.html');
        await page.locator('[data-tab="signup"]').click();
        await page.locator('#firstName').fill('New');
        await page.locator('#lastName').fill('User');
        await page.locator('#signupEmail').fill('new@example.com');
        await page.locator('#signupPassword').fill('StrongPass1');
        await page.locator('#confirmPassword').fill('StrongPass1');
        await page.locator('label[for="agreeTerms"], #agreeTerms + .checkmark').first().click();
        await page.locator('#signupForm button[type="submit"]').click();
        await expect(page).toHaveURL(/index\.html/);
    });

    test('logs in with Firebase and rejects a failed login', async ({ page }) => {
        await mockFirebase(page);
        await page.goto('/auth.html');
        await page.locator('#loginEmail').fill('test@example.com');
        await page.locator('#loginPassword').fill('WrongPassword1');
        await page.locator('#loginForm button[type="submit"]').click();
        await expect(page.locator('.toast.error')).toContainText('Invalid email or password.');
        await expect(page).toHaveURL(/auth\.html/);
        await page.locator('#loginPassword').fill('CorrectPassword1');
        await page.locator('#loginForm button[type="submit"]').click();
        await expect(page).toHaveURL(/index\.html/);
    });

    test('logs out and does not restore the authenticated header', async ({ page }) => {
        await mockFirebase(page);
        await page.goto('/auth.html');
        await page.locator('#loginEmail').fill('test@example.com');
        await page.locator('#loginPassword').fill('CorrectPassword1');
        await page.locator('#loginForm button[type="submit"]').click();
        await expect(page).toHaveURL(/index\.html/);
        await page.locator('#userProfileSection').hover();
        await page.locator('#logoutBtn').click({ force: true });
        await expect(page.locator('#loginBtn')).toBeVisible();
        await expect(page.locator('#logoutBtn')).toBeHidden();
    });

    test('sends a password reset request without exposing account existence', async ({ page }) => {
        await mockFirebase(page);
        await page.goto('/auth.html');
        await page.locator('.forgot-link').click();
        await page.locator('#forgotEmail').fill('test@example.com');
        await page.locator('#forgotForm button[type="submit"]').click();
        await expect(page.locator('#successTitle')).toHaveText('Check Your Email');
    });

    test('restores a Firebase session without a hand-written user record', async ({ page }) => {
        await mockFirebase(page);
        await page.goto('/auth.html');
        await page.locator('#loginEmail').fill('test@example.com');
        await page.locator('#loginPassword').fill('CorrectPassword1');
        await page.locator('label[for="rememberMe"], #rememberMe + .checkmark').first().click();
        await page.locator('#loginForm button[type="submit"]').click();
        await expect(page).toHaveURL(/index\.html/);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.locator('#userProfileSection').hover();
        await expect(page.locator('#userDisplayName')).toHaveText('Test User');
    });
});
