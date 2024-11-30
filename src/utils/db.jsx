export function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ChromeAssistDB", 6); // Incremented version to trigger upgrade

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log("Upgrade needed:", db);

      // Create 'bookmarks' object store
      if (!db.objectStoreNames.contains("bookmarks")) {
        console.log("Creating 'bookmarks' object store");
        const objectStore = db.createObjectStore("bookmarks", { keyPath: "id" });

        // Define indexes based on the structure of bookmarkData
        objectStore.createIndex("url", "url", { unique: true });
        objectStore.createIndex("favicon", "favicon", { unique: false });
        objectStore.createIndex("title", "title", { unique: false });
        objectStore.createIndex("keywords", "keywords", { unique: false });
        objectStore.createIndex("tldr", "tldr", { unique: false });
      }

      // Create 'outputs' object store
      if (!db.objectStoreNames.contains("outputs")) {
        console.log("Creating 'outputs' object store");
        const objectStore = db.createObjectStore("outputs", { keyPath: "id" });
        objectStore.createIndex("type", "type", { unique: false });
        objectStore.createIndex("timestamp", "timestamp", { unique: false });
      }
    };

    request.onsuccess = () => {
      console.log("Database opened successfully");
      resolve(request.result);
    };

    request.onerror = (event) => {
      console.error("Database error:", event.target.error);
      reject(event.target.error);
    };
  });
}

export async function fetchBookmarks() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("bookmarks", "readonly");
    const objectStore = transaction.objectStore("bookmarks");
    const request = objectStore.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.errorCode);

    transaction.oncomplete = () => {
      console.log("Transaction complete for fetchBookmarks");
      db.close(); // Close the database connection
    };
  });
}

export async function saveBookmark(bookmarkData) {
  console.log("Saving bookmark:", bookmarkData);
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction("bookmarks", "readwrite");
    const objectStore = transaction.objectStore("bookmarks");
    const request = objectStore.put(bookmarkData);

    transaction.oncomplete = () => {
      db.close(); // Close the database connection
      resolve();
    };

    transaction.onerror = (event) => {
      db.close(); // Close the database connection
      reject(event.target.errorCode);
    };

    request.onerror = (event) => {
      db.close(); // Close the database connection
      reject(event.target.errorCode);
    };

    request.onsuccess = () => {
      console.log("Bookmark saved successfully");
    };
  });
}

export async function deleteBookmark(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("bookmarks", "readwrite");
    const objectStore = transaction.objectStore("bookmarks");
    const request = objectStore.delete(id);

    transaction.oncomplete = () => {
      db.close(); // Close the database connection
      resolve();
    };
    transaction.onerror = (event) => {
      db.close(); // Close the database connection
      reject(event.target.errorCode);
    };

    request.onerror = (event) => {
      db.close(); // Close the database connection
      reject(event.target.errorCode);
    };
  });
}

export async function saveOutput(outputData) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("outputs", "readwrite");
    const objectStore = transaction.objectStore("outputs");
    const request = objectStore.put(outputData);

    transaction.oncomplete = () => {
      db.close(); // Close the database connection
      resolve();
    };
    transaction.onerror = (event) => {
      db.close(); // Close the database connection
      reject(event.target.errorCode);
    };

    request.onerror = (event) => {
      db.close(); // Close the database connection
      reject(event.target.errorCode);
    };
  });
}

export async function fetchOutputs() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("outputs", "readonly");
    const objectStore = transaction.objectStore("outputs");
    const index = objectStore.index("timestamp");
    const request = index.getAll();

    request.onsuccess = () => {
      const results = request.result;
      resolve(results.reverse()); // Reverse the results to get descending order
    };
    request.onerror = (event) => reject(event.target.errorCode);

    transaction.oncomplete = () => {
      console.log("Transaction complete for fetchOutputs");
      db.close(); // Close the database connection
    };
  });
}

export async function deleteOutput(outputID) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("outputs", "readwrite");
    const objectStore = transaction.objectStore("outputs");
    const request = objectStore.delete(outputID);

    transaction.oncomplete = () => {
      db.close(); // Close the database connection
      resolve();
    };
    transaction.onerror = (event) => {
      db.close(); // Close the database connection
      reject(event.target.errorCode);
    };

    request.onerror = (event) => {
      db.close(); // Close the database connection
      reject(event.target.errorCode);
    };
  });
}