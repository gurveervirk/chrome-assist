export function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ChromeAssistDB", 7); // Incremented version to trigger upgrade

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

      // Create 'embeddings' object store
      if (!db.objectStoreNames.contains("embeddings")) {
        console.log("Creating 'embeddings' object store");
        const objectStore = db.createObjectStore("embeddings", { keyPath: "id" });
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

export async function saveEmbedding(embeddingData) {
  console.log("Saving embedding:", embeddingData);
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction("embeddings", "readwrite");
    const objectStore = transaction.objectStore("embeddings");
    const request = objectStore.put(embeddingData);

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
      console.log("Embedding saved successfully");
    };
  });
}

export async function fetchEmbeddings(ids) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("embeddings", "readonly");
    const objectStore = transaction.objectStore("embeddings");

    const requests = ids.map(
      (id) =>
        new Promise((resolveRequest) => {
          const request = objectStore.get(id);
          request.onsuccess = () => {
            if (request.result) {
              resolveRequest({
                id,
                embedding: request.result.embedding,
              });
            } else {
              resolveRequest(null); // No result, resolve with null
            }
          };
          request.onerror = () => {
            console.error("Error fetching embedding for ID:", id);
            resolveRequest(null); // Resolve with null to continue
          };
        })
    );

    Promise.all(requests)
      .then((results) => {
        const embeddings = results.filter((result) => result !== null); // Remove null entries
        resolve(embeddings);
      })
      .catch((error) => {
        console.error("Error during embedding fetch:", error);
        reject(error);
      });

    transaction.oncomplete = () => {
      console.log("Transaction complete for fetchEmbeddings");
      db.close(); // Close the database connection
    };
  });
}

export async function deleteBookmark(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["bookmarks", "embeddings"], "readwrite");

    const bookmarksStore = transaction.objectStore("bookmarks");
    const embeddingStore = transaction.objectStore("embeddings");

    const bookmarkRequest = bookmarksStore.delete(id);
    const embeddingRequest = embeddingStore.delete(id);

    transaction.oncomplete = () => {
      db.close(); // Close the database connection
      resolve();
    };

    transaction.onerror = (event) => {
      db.close(); // Close the database connection
      reject(event.target.errorCode);
    };

    bookmarkRequest.onerror = (event) => {
      db.close(); // Close the database connection
      reject(event.target.errorCode);
    };

    embeddingRequest.onerror = (event) => {
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
    const transaction = db.transaction(["outputs", "embeddings"], "readwrite");

    const outputsStore = transaction.objectStore("outputs");
    const embeddingStore = transaction.objectStore("embeddings");

    const outputRequest = outputsStore.delete(outputID);
    const embeddingRequest = embeddingStore.delete(outputID);

    transaction.oncomplete = () => {
      db.close(); // Close the database connection
      resolve();
    };

    transaction.onerror = (event) => {
      db.close(); // Close the database connection
      reject(event.target.errorCode);
    };

    outputRequest.onerror = (event) => {
      db.close(); // Close the database connection
      reject(event.target.errorCode);
    };

    embeddingRequest.onerror = (event) => {
      db.close(); // Close the database connection
      reject(event.target.errorCode);
    };
  });
}