import "server-only";

import { FirebaseError, getApps as getClientApps, initializeApp as initializeClientApp } from "firebase/app";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore as getClientFirestore,
  limit as limitQuery,
  query,
  setDoc,
  type DocumentData,
  type Firestore as ClientFirestore,
} from "firebase/firestore/lite";
import { cert, getApps as getAdminApps, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import {
  FirebaseConfigurationError,
  getFirebaseConfig,
  getMissingFirebaseEnv,
  hasFirebaseAdminCredentials,
} from "@/lib/firebase-config";

type FirestoreDocumentSnapshot = {
  id: string;
  exists: boolean;
  data(): DocumentData | undefined;
};

type FirestoreQuerySnapshot = {
  docs: Array<{
    id: string;
    data(): DocumentData;
  }>;
};

type FirestoreDocumentReference = {
  get(): Promise<FirestoreDocumentSnapshot>;
  set(data: DocumentData, options?: { merge?: boolean }): Promise<unknown>;
};

type FirestoreCollectionReference = {
  doc(id: string): FirestoreDocumentReference;
  get(): Promise<FirestoreQuerySnapshot>;
  limit(count: number): {
    get(): Promise<FirestoreQuerySnapshot>;
  };
};

export type FirestoreDatabase = {
  collection(path: string): FirestoreCollectionReference;
};

type ServiceAccount = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

let cachedDb: FirestoreDatabase | null | undefined;

function normalizeServiceAccount(account: Record<string, string>): ServiceAccount | null {
  const projectId = account.projectId || account.project_id;
  const clientEmail = account.clientEmail || account.client_email;
  const privateKey = account.privateKey || account.private_key;

  if (!projectId || !clientEmail || !privateKey) return null;

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const decoded = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      "base64",
    ).toString("utf8");
    return normalizeServiceAccount(JSON.parse(decoded) as Record<string, string>);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (projectId && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return normalizeServiceAccount({
      projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });
  }

  return null;
}

function toClientQuerySnapshot(snapshot: Awaited<ReturnType<typeof getDocs>>): FirestoreQuerySnapshot {
  return {
    docs: snapshot.docs.map((entry) => ({
      id: entry.id,
      data: () => entry.data() as DocumentData,
    })),
  };
}

function createClientFirestore(db: ClientFirestore): FirestoreDatabase {
  return {
    collection(path: string) {
      const collectionRef = collection(db, path);

      return {
        doc(id: string) {
          const docRef = doc(db, path, id);

          return {
            async get() {
              const snapshot = await getDoc(docRef);

              return {
                id: snapshot.id,
                exists: snapshot.exists(),
                data: () => snapshot.data() as DocumentData | undefined,
              };
            },
            async set(data: DocumentData, options?: { merge?: boolean }) {
              if (options?.merge) {
                return setDoc(docRef, data, { merge: true });
              }

              return setDoc(docRef, data);
            },
          };
        },
        async get() {
          return toClientQuerySnapshot(await getDocs(collectionRef));
        },
        limit(count: number) {
          return {
            async get() {
              return toClientQuerySnapshot(await getDocs(query(collectionRef, limitQuery(count))));
            },
          };
        },
      };
    },
  };
}

export function getFirestoreAdmin() {
  if (cachedDb !== undefined) return cachedDb;

  const serviceAccount = getServiceAccount();
  if (serviceAccount) {
    const firebaseConfig = getFirebaseConfig();

    if (!getAdminApps().length) {
      initializeAdminApp({
      credential: cert(serviceAccount),
      projectId: firebaseConfig?.projectId || serviceAccount.projectId,
      storageBucket: firebaseConfig?.storageBucket,
      });
    }

    cachedDb = getAdminFirestore() as unknown as FirestoreDatabase;
    return cachedDb;
  }

  const firebaseConfig = getFirebaseConfig();
  if (!firebaseConfig) {
    if (canUseMemoryFallback()) {
      cachedDb = null;
      return cachedDb;
    }

    throw new FirebaseConfigurationError(getMissingFirebaseEnv());
  }

  const app = getClientApps()[0] || initializeClientApp(firebaseConfig);
  cachedDb = createClientFirestore(getClientFirestore(app));
  return cachedDb;
}

export function canUseMemoryFallback() {
  return process.env.NODE_ENV === "development" && process.env.VERCEL !== "1" && !hasFirebaseAdminCredentials();
}

function getErrorCode(error: unknown) {
  if (error instanceof FirebaseError) return error.code;

  if (typeof error === "object" && error) {
    const candidate = error as {
      code?: string | number;
      errorInfo?: { code?: string };
    };
    return candidate.errorInfo?.code || candidate.code;
  }

  return undefined;
}

export function getFirestoreErrorMessage(error: unknown) {
  if (error instanceof FirebaseConfigurationError) return error.message;

  const code = getErrorCode(error);
  const message = error instanceof Error ? error.message : "Unknown Firestore error.";

  if (code === "not-found" || /database.*does not exist|firestore.*not.*enabled|firestore api.*disabled|firestore api has not been used/i.test(message)) {
    return "Firestore database is missing or disabled. Create or enable Firestore for this Firebase project.";
  }

  if (code === "permission-denied" || code === 7 || code === "PERMISSION_DENIED") {
    return "Firestore permission denied. Update Firestore rules to allow the required server-side reads and writes.";
  }

  return `Firestore connection failed: ${message.replace(/key=[^&\s]+/g, "key=[redacted]")}`;
}

async function verifyFirestoreReadWrite(db: FirestoreDatabase) {
  const docRef = db.collection("toolverse_status").doc("firestore");

  await docRef.set(
    {
      checkedAt: new Date().toISOString(),
      source: "api-status",
    },
    { merge: true },
  );

  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error("Firestore status document could not be read after writing.");
  }
}

export async function getFirebaseStatus() {
  const missing = getMissingFirebaseEnv();
  const testedAt = new Date().toISOString();

  if (missing.length) {
    return {
      id: "firebase",
      name: "Firebase Firestore",
      purpose: "Usage, admin settings, analytics",
      configured: false,
      ok: canUseMemoryFallback(),
      message: canUseMemoryFallback()
        ? `Using local memory fallback. Missing Firebase env: ${missing.join(", ")}.`
        : `Missing Firebase env: ${missing.join(", ")}.`,
      missing,
      testedAt,
    };
  }

  const startedAt = Date.now();

  try {
    const db = getFirestoreAdmin();

    if (!db) {
      return {
        id: "firebase",
        name: "Firebase Firestore",
        purpose: "Usage, admin settings, analytics",
        configured: false,
        ok: true,
        message: "Using local memory fallback. Configure Firebase before production.",
        missing,
        testedAt,
      };
    }

    await verifyFirestoreReadWrite(db);

    return {
      id: "firebase",
      name: "Firebase Firestore",
      purpose: "Usage, admin settings, analytics",
      configured: true,
      ok: true,
      message: "Firestore connection verified.",
      missing,
      latencyMs: Date.now() - startedAt,
      testedAt,
    };
  } catch (error) {
    return {
      id: "firebase",
      name: "Firebase Firestore",
      purpose: "Usage, admin settings, analytics",
      configured: false,
      ok: false,
      message: getFirestoreErrorMessage(error),
      missing,
      latencyMs: Date.now() - startedAt,
      testedAt,
    };
  }
}
