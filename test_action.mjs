import { getExamHubData } from "./src/actions/student-actions.js";
import prisma from "./src/lib/prisma/client.js";

async function test() {
    try {
        const result = await getExamHubData();
        console.log("Result success:", result.success);
        if (result.success && result.data) {
            console.log("Mock Tests Count:", result.data.mockTests.length);
            console.log("Sample Mock Test:", result.data.mockTests[0]?.title);
            console.log("Chapter-wise MCQs Count:", result.data.chapterWiseMCQs.length);
        } else {
            console.log("Error or no data:", result.message);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
