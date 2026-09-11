const { initialState, reduceAuthState, isAuthenticated } = require('../../auth-state');

describe('Firebase auth state transitions', () => {
    it('starts loading without treating the user as authenticated', () => {
        expect(initialState.status).toBe('loading');
        expect(isAuthenticated(initialState)).toBe(false);
    });

    it('enters the authenticated state only for a Firebase user', () => {
        const user = { uid: 'firebase-user-1', email: 'user@example.com' };
        const state = reduceAuthState(initialState, { type: 'AUTHENTICATED', user });

        expect(state).toEqual({ status: 'authenticated', user, error: null });
        expect(isAuthenticated(state)).toBe(true);
    });

    it('clears the user on sign out', () => {
        const authenticated = reduceAuthState(initialState, { type: 'AUTHENTICATED', user: { uid: '1' } });
        const state = reduceAuthState(authenticated, { type: 'SIGNED_OUT' });

        expect(state).toEqual({ status: 'unauthenticated', user: null, error: null });
        expect(isAuthenticated(state)).toBe(false);
    });

    it('fails closed when Firebase reports an auth error', () => {
        const state = reduceAuthState(initialState, { type: 'AUTH_ERROR', error: 'network' });

        expect(state.status).toBe('error');
        expect(state.user).toBeNull();
        expect(isAuthenticated(state)).toBe(false);
    });
});
