function createCookieStore(initialValues = {}) {
    const cookies = new Map(Object.entries(initialValues));
    const setCalls = [];

    return {
        cookies,
        setCalls,
        get(name) {
            const value = cookies.get(name);
            return value ? { value } : undefined;
        },
        set(name, value, options) {
            cookies.set(name, value);
            setCalls.push({ name, value, options });
        },
    };
}

let currentCookieStore = createCookieStore();

async function cookies() {
    return currentCookieStore;
}

function __setMockCookies(initialValues = {}) {
    currentCookieStore = createCookieStore(initialValues);
    return currentCookieStore;
}

function __getMockCookies() {
    return currentCookieStore;
}

module.exports = {
    cookies,
    __setMockCookies,
    __getMockCookies,
};
