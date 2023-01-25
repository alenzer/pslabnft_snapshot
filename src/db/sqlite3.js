const sqlite3 = require('sqlite3').verbose();

let db = null;

const connect = () => {
   // db = new sqlite3.Database(':memory:', (err) => {
   //    if (err) {
   //       return console.error(err.message);
   //    }
   //    console.log('Connected to the in-memory SQlite database.');
   // });

   db = new sqlite3.Database('./snapshot.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      if (err) {
         return console.error(err.message);
      }
      console.log('Connected to the SQlite database.');
   });
};

const create = (callback) => {
   db.serialize(() => {
      db.run('CREATE TABLE snapshot (id TEXT PRIMARY KEY, wallet TEXT, counter INTEGER)', () => {
         callback();
      })
   })
};

const insert = (id, wallet, counter) => {
   db.serialize(() => {
      db.run(`INSERT INTO snapshot
            VALUES( "${id}", "${wallet}", ${counter})`);
   });
}

const update = (id, counter) => {
   db.serialize(() => {
      db.run(`UPDATE snapshot SET counter="${counter}" WHERE id="${id}"`);
   });
}

const drop = (id) => {
   db.serialize(() => {
      db.run(`DELETE From snapshot WHERE id="${id}"`);
   });
}
const query = () =>
   new Promise((resolve, reject) => {
      db.serialize(() => {
         db.all(`SELECT * FROM snapshot order by id + 0`, (err, rows) => {
            if (err) {
               reject(err);
            }
            resolve(rows);
         });
      })
   })


const close = () => {
   db.close((err) => {
      if (err) {
         return console.error(err.message);
      }
      console.log('Close the database connection.');
   });
}
module.exports = { connect, create, insert, update, drop, query, close };