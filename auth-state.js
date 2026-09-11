(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.WeatherWiseAuthState = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    const initialState = Object.freeze({ status: 'loading', user: null, error: null });

    function reduceAuthState(state, event) {
        switch (event.type) {
            case 'AUTHENTICATED':
                return { status: 'authenticated', user: event.user, error: null };
            case 'UNAUTHENTICATED':
            case 'SIGNED_OUT':
                return { status: 'unauthenticated', user: null, error: null };
            case 'AUTH_ERROR':
                return { status: 'error', user: null, error: event.error || 'Authentication unavailable' };
            default:
                return state;
        }
    }

    function isAuthenticated(state) {
        return state.status === 'authenticated' && Boolean(state.user);
    }

    return { initialState, reduceAuthState, isAuthenticated };
}));
