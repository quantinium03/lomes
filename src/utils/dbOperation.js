import dbPromise from "../db/index.js";

async function dbOperation(operation, sql, params = []) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    db[operation](sql, params, function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(operation === 'run' ? this : result);
      }
    });
  });
}

export { dbOperation };
