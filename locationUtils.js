(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.getUserLocation = factory().getUserLocation;
    }
}(typeof window !== 'undefined' ? window : globalThis, function () {
    function getUserLocation(options = {}) {
        const { timeout = 10000 } = options;
        if (!navigator.geolocation) {
            return Promise.reject(new Error('Geolocation is not available.'));
        }

        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout });
        });
    }

    return { getUserLocation };
}));
