import "server-only";

type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
};

export const firebaseEnvKeys = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
] as const;

export class FirebaseConfigurationError extends Error {
  missing: string[];

  constructor(missing: string[]) {
    super(
      `Missing Firebase environment variables: ${missing.join(", ")}. Add them in Vercel Project Settings > Environment Variables and redeploy.`,
    );
    this.name = "FirebaseConfigurationError";
    this.missing = missing;
  }
}

function readFirebaseEnv(key: (typeof firebaseEnvKeys)[number]) {
  return process.env[key]?.trim() || "";
}

export function getFirebaseEnvReport() {
  return firebaseEnvKeys.map((key) => ({
    key,
    configured: Boolean(readFirebaseEnv(key)),
  }));
}

export function getMissingFirebaseEnv() {
  return getFirebaseEnvReport()
    .filter((entry) => !entry.configured)
    .map((entry) => entry.key);
}

export function validateFirebaseConfig() {
  const missing = getMissingFirebaseEnv();
  if (missing.length) {
    throw new FirebaseConfigurationError(missing);
  }
}

export function getFirebaseConfig(): FirebaseWebConfig | null {
  const missing = getMissingFirebaseEnv();
  if (missing.length) {
    return null;
  }

  return {
    apiKey: readFirebaseEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: readFirebaseEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId: readFirebaseEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    storageBucket: readFirebaseEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: readFirebaseEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
    appId: readFirebaseEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
    measurementId: readFirebaseEnv("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID"),
  };
}

export function hasFirebaseAdminCredentials() {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ||
      ((process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY),
  );
}
