import { getResolvedPlatformConfig } from "../src/lib/server/platform-config";
import { verifyMsg91WidgetToken } from "../src/lib/server/msg91";

async function diagnose() {
    const config = await getResolvedPlatformConfig();
    console.log("MSG91 Config Status:");
    console.log("- Auth Key:", config.values.msg91AuthKey ? "PRESENT (hidden)" : "MISSING");
    console.log("- Widget ID:", config.values.msg91WidgetId || "MISSING");
    console.log("- Token Auth:", config.values.msg91TokenAuth || "MISSING");
    
    // Test with a mock token or a known bad one to see the error message
    console.log("\nTesting verifyMsg91WidgetToken with 'invalid-test-token'...");
    const result = await verifyMsg91WidgetToken("invalid-test-token");
    console.log("Result:", JSON.stringify(result, null, 2));
}

diagnose().catch(console.error);
