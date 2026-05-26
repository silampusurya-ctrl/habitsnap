const DB_NAME = 'habitsnap_photos_v1';
const STORE = 'photos';
const VERSION = 1;

let _db = null;

async function getDb() {
  if (_db) return _db;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'key' });
        store.createIndex('dateIdx', 'date', { unique: false });
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

export async function savePhoto(dateKey, habitId, base64) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ key: `${dateKey}__${habitId}`, date: dateKey, habitId, photo: base64 });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPhoto(dateKey, habitId) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(`${dateKey}__${habitId}`);
    req.onsuccess = () => resolve(req.result?.photo ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function loadTodayPhotos(dateKey, habitIds) {
  const pairs = await Promise.all(habitIds.map(async (id) => [id, await getPhoto(dateKey, id)]));
  return Object.fromEntries(pairs.filter(([, p]) => p));
}

export async function pruneOldPhotos() {
  const db = await getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffKey = cutoff.toISOString().split('T')[0];
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    store.index('dateIdx').openCursor(IDBKeyRange.upperBound(cutoffKey, true)).onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) { store.delete(cursor.primaryKey); cursor.continue(); }
    };
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
