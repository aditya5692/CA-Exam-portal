import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
    const config = await prisma.platformConfig.findUnique({
        where: { singletonKey: "default" }
    });
    
    if (config) {
        console.log("Config from DB:");
        console.log("- msg91AuthKey:", config.msg91AuthKey ? "SET (encrypted/hidden)" : "MISSING");
        console.log("- msg91WidgetId:", config.msg91WidgetId);
        console.log("- msg91TokenAuth:", config.msg91TokenAuth);
    } else {
        console.log("No config found in database.");
    }
}

check().catch(console.error).finally(() => prisma.$disconnect());
