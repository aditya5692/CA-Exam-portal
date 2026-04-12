import * as admin from "firebase-admin";

const IS_PROD = process.env.NODE_ENV === "production";

/**
 * Initializes the Firebase Admin SDK.
 * This should only run on the server.
 */
function initializeAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Look for credentials in environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Handle escaped newlines in private key
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    if (IS_PROD) {
      throw new Error("FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY must be set in production.");
    }
    console.warn("Firebase Admin credentials missing. Verification will fail unless mock tokens are used.");
    return null;
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const adminApp = initializeAdmin();

export const verifyIdToken = async (token: string) => {
  if (!adminApp) {
    if (!IS_PROD && token === "mock-firebase-token") {
      return { phone_number: "917065751756", uid: "mock-uid" };
    }
    throw new Error("Firebase Admin not initialized.");
  }
  return admin.auth(adminApp).verifyIdToken(token);
};

export { adminApp };
