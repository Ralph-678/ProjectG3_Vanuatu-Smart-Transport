export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("TransportDB", 2);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("bookings")) {
        db.createObjectStore("bookings", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("trips")) {
        db.createObjectStore("trips", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("availabilities")) {
        db.createObjectStore("availabilities", { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addData(store, data) {
  const db = await initDB();
  const tx = db.transaction(store, "readwrite");
  tx.objectStore(store).put(data);
}

export async function deleteData(store, id) {
  const db = await initDB();
  const tx = db.transaction(store, "readwrite");
  tx.objectStore(store).delete(id);
}

export async function getAllData(store) {
  const db = await initDB();
  return new Promise((resolve) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
  });
}