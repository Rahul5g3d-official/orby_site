import type { StoredRecording } from "../types/recording";

const DB_NAME = "multicam-web-recorder";
const DB_VERSION = 1;
const RECORDINGS_STORE = "recordings";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(RECORDINGS_STORE)) {
        const store = database.createObjectStore(RECORDINGS_STORE, {
          keyPath: "id",
        });
        store.createIndex("createdAt", "createdAt");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveRecording(recording: StoredRecording): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(RECORDINGS_STORE, "readwrite");
  transaction.objectStore(RECORDINGS_STORE).put(recording);
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function getRecordings(): Promise<StoredRecording[]> {
  const database = await openDatabase();
  const transaction = database.transaction(RECORDINGS_STORE, "readonly");
  const recordings = await promisifyRequest<StoredRecording[]>(
    transaction.objectStore(RECORDINGS_STORE).getAll(),
  );
  database.close();
  return recordings.sort((first, second) =>
    second.createdAt.localeCompare(first.createdAt),
  );
}

export async function deleteRecording(id: string): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(RECORDINGS_STORE, "readwrite");
  transaction.objectStore(RECORDINGS_STORE).delete(id);
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}
