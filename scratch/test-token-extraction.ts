// Simple test for the extractAccessToken logic
function extractAccessToken(data: any) {
    if (typeof data === "string") return data;
    if (!data || typeof data !== "object") return "";
    const payload = data;
    const candidate = payload.token ?? payload.accessToken ?? payload.access_token ?? payload.jwt ?? payload.message;
    if (typeof candidate !== "string") return "";
    if (candidate === payload.message && !candidate.includes(".")) {
        if (typeof payload.token === "string" && payload.token.includes(".")) return payload.token;
        return "";
    }
    return candidate;
}

const testCases = [
    {
        name: "Old structure (JWT in message)",
        input: { message: "header.payload.signature" },
        expected: "header.payload.signature"
    },
    {
        name: "New structure (JWT in token, status in message)",
        input: { message: "OTP Verified", token: "header.payload.signature" },
        expected: "header.payload.signature"
    },
    {
        name: "Ambiguous structure (JWT in both)",
        input: { message: "h1.p1.s1", token: "h2.p2.s2" },
        expected: "h2.p2.s2" // Priorities token
    },
    {
        name: "Broken structure (Status only)",
        input: { message: "OTP Verified" },
        expected: ""
    }
];

testCases.forEach(tc => {
    const result = extractAccessToken(tc.input);
    console.log(`[${tc.name}] -> ${result === tc.expected ? "PASS" : "FAIL"} (got: "${result}")`);
});
