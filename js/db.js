// --- INDEXED DB HELPER (Limitless Image Storage) ---

const DBName = "TitanDnDDB";
const DBStore = "images";

const DB = {
    open: () => {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DBName, 1);
            req.onupgradeneeded = (e) => {
                e.target.result.createObjectStore(DBStore);
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },
    save: async (id, data) => {
        if (!data) return;
        const db = await DB.open();
        const tx = db.transaction(DBStore, 'readwrite');
        tx.objectStore(DBStore).put(data, id);
        return new Promise(resolve => tx.oncomplete = resolve);
    },
    get: async (id) => {
        const db = await DB.open();
        return new Promise(resolve => {
            const req = db.transaction(DBStore, 'readonly').objectStore(DBStore).get(id);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
        });
    },
    clear: async () => {
        const db = await DB.open();
        const tx = db.transaction(DBStore, 'readwrite');
        tx.objectStore(DBStore).clear();
        return new Promise(resolve => tx.oncomplete = resolve);
    }
};
