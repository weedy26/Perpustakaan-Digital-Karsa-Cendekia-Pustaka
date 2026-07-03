import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  writeBatch,
  getDocFromServer
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { ClassItem, Book, Member, Loan, LibraryIdentity, WaTemplate, SystemConfig } from "../types";

// Safe initialization of Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific database ID if present, otherwise default
export const db = (firebaseConfig as any).firestoreDatabaseId 
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);

/**
 * Test the Firestore connection to ensure proper configuration
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const testDocRef = doc(db, "config", "connection_test");
    await getDocFromServer(testDocRef);
    return true;
  } catch (error) {
    console.error("Firebase connection test failed:", error);
    return false;
  }
}

/**
 * Save all application state to Firestore in a transactional/batch format
 */
export async function saveToFirestore(data: {
  classes: ClassItem[];
  books: Book[];
  members: Member[];
  loans: Loan[];
  identity: LibraryIdentity;
  config: SystemConfig;
  templates: WaTemplate[];
}): Promise<void> {
  // Batch 1: Config & Identity
  const configBatch = writeBatch(db);
  
  configBatch.set(doc(db, "config", "identity"), data.identity);
  configBatch.set(doc(db, "config", "system"), data.config);
  
  await configBatch.commit();

  // Helper for batching large collections (Firestore limits write batches to 500 operations)
  const commitInChunks = async (collectionName: string, items: any[]) => {
    let batch = writeBatch(db);
    let count = 0;
    
    for (const item of items) {
      if (!item.id && !item.type) continue;
      const docId = item.id || item.type; // WaTemplate uses type as identifier
      const docRef = doc(db, collectionName, docId);
      batch.set(docRef, item);
      count++;
      
      if (count === 400) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
    }
    
    if (count > 0) {
      await batch.commit();
    }
  };

  // Save collections
  await commitInChunks("classes", data.classes);
  await commitInChunks("books", data.books);
  await commitInChunks("members", data.members);
  await commitInChunks("loans", data.loans);
  await commitInChunks("templates", data.templates);
}

/**
 * Load all application state from Firestore
 */
export async function loadFromFirestore(): Promise<{
  classes: ClassItem[] | null;
  books: Book[] | null;
  members: Member[] | null;
  loans: Loan[] | null;
  identity: LibraryIdentity | null;
  config: SystemConfig | null;
  templates: WaTemplate[] | null;
}> {
  // Load single config docs
  const identitySnap = await getDoc(doc(db, "config", "identity"));
  const configSnap = await getDoc(doc(db, "config", "system"));

  const identity = identitySnap.exists() ? identitySnap.data() as LibraryIdentity : null;
  const config = configSnap.exists() ? configSnap.data() as SystemConfig : null;

  // Helper for fetching entire collection
  const fetchCollection = async (collectionName: string): Promise<any[]> => {
    const snap = await getDocs(collection(db, collectionName));
    return snap.docs.map(d => d.data());
  };

  const classes = await fetchCollection("classes") as ClassItem[];
  const books = await fetchCollection("books") as Book[];
  const members = await fetchCollection("members") as Member[];
  const loans = await fetchCollection("loans") as Loan[];
  const templates = await fetchCollection("templates") as WaTemplate[];

  return {
    classes: classes.length > 0 ? classes : null,
    books: books.length > 0 ? books : null,
    members: members.length > 0 ? members : null,
    loans: loans.length > 0 ? loans : null,
    identity,
    config,
    templates: templates.length > 0 ? templates : null
  };
}
