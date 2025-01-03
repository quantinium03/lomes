import sqlite3 from 'sqlite3';
import { DB_NAME } from '../constants.js';

const sqlite = sqlite3.verbose();

function createUserTable(db) {
  return new Promise((resolve, reject) => {
    const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      refreshToken TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `;
    db.run(sql, (err) => {
      if (err) {
        console.log('Error creating user table', err.message);
        reject(err);
      } else {
        console.log('Created the user table successfully');
        resolve();
      }
    });
  });
}

function createMoviesTable(db) {
  return new Promise((resolve, reject) => {
    const sql = `
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL UNIQUE,
      directoryPath TEXT NOT NULL UNIQUE,
      filePath TEXT NOT NULL UNIQUE,
      year TEXT,
      releaseDate TEXT,
      runtime TEXT,
      genre TEXT,
      director TEXT,
      writer TEXT,
      actor TEXT,
      description TEXT,
      language TEXT,
      country TEXT,
      posterUrl TEXT UNIQUE,
      imdbRating TEXT
    );
      `;
    db.run(sql, (err) => {
      if (err) {
        console.log('Error creating the movies table', err.message);
        reject(err);
      } else {
        console.log('Created the movies table successfully');
        resolve();
      }
    });
  });
}

function createTvShowsTable(db) {
  return new Promise((resolve, reject) => {
    const sql = `CREATE TABLE IF NOT EXISTS tvshows (
      tvShowId INTEGER NOT NULL UNIQUE,
      title TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      noOfSeasons INTEGER NOT NULL,
      premieredData TEXT,
      endedDate TEXT,
      genre TEXT,
      status TEXT,
      rating TEXT,
      posterURl TEXT,
      imdbId TEXT
    );`;
    db.run(sql, (err) => {
      if (err) {
        console.log('Error creating the seasons table', err.message);
        reject(err);
      } else {
        console.log('Created the Tv shows table successfully');
        resolve();
      }
    });
  });
}

function createSeasonsTable(db) {
  return new Promise((resolve, reject) => {
    const sql = `CREATE TABLE IF NOT EXISTS seasons (
    tvShowId INTEGER NOT NULL,
    seasonNumber INTEGER NOT NULL,
    title TEXT,
    description TEXT, 
    seasonPosterUrl TEXT UNIQUE,
    FOREIGN KEY (tvShowId) REFERENCES tvshows(id) ON DELETE CASCADE
);
`;
    db.run(sql, (err) => {
      if (err) {
        console.log('Error creating the seasons table', err.message);
        reject(err);
      } else {
        console.log('Created the seasons table successfully');
        resolve();
      }
    });
  });
}

function createEpisodesTable(db) {
  return new Promise((resolve, reject) => {
    const sql = `
    CREATE TABLE IF NOT EXISTS tvShowsepisodes (
      tvShowId INTEGER NOT NULL,
      tvShowTitle TEXT NOT NULL,
      seasonNumber INTEGER NOT NULL,
      episodeNumber INTEGER NOT NULL,
      episodeTitle TEXT NOT NULL,
      airDate TEXT,
      airTime TEXT,
      runtime TEXT,
      rating TEXT,
      episodePosterUrl TEXT,
      description TEXT,
      episodePath TEXT UNIQUE NOT NULL,
      FOREIGN KEY (tvShowId) REFERENCES seasons (tvShowId) ON DELETE CASCADE
    );
`;
    db.run(sql, (err) => {
      if (err) {
        console.log('Error creating the seasons table', err.message);
        reject(err);
      } else {
        console.log('Created the season table successfully');
        resolve();
      }
    });
  });
}

function createAnimeTable(db) {
  return new Promise((resolve, reject) => {
    const sql = `
      CREATE TABLE IF NOT EXISTS anime (
        Id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        animeId INTEGER UNIQUE NOT NULL,
        title TEXT NOT NULL,
        type TEXT,
        episodeNo INTEGER,
        source TEXT,
        status TEXT,
        description TEXT NOT NULL,
        score INTEGER,
        year INTEGER,
        studios TEXT,
        genre TEXT,
        demographic TEXT,
        posterUrl TEXT
      );
    `;
    db.run(sql, (err) => {
      if (err) {
        console.log("Error creating the anime table", err.message);
        reject(err);
      } else {
        console.log("Created the anime table successfully");
        resolve();
      }
    })

  })
}

function createAnimeEpisode(db) {
  return new Promise((resolve, reject) => {
    const sql = `
      CREATE TABLE IF NOT EXISTS animeEpisodes (
        Id INTEGER UNIQUE PRIMARY KEY AUTOINCREMENT NOT NULL,
        animeId INTEGER NOT NULL,
        episodeId INTEGER NOT NULL,
        title TEXT NOT NULL,
        score INTEGER,
        description TEXT,
        posterUrl TEXT,
        episodePath TEXT UNIQUE NOT NULL
      );
    `;
    db.run(sql, (err) => {
      if (err) {
        console.log("Error creating the animeEpisodes table", err.message);
        reject(err);
      } else {
        console.log("Created the animeEpisodes table successfully");
        resolve(err);
      }
    });
  });
}

function createSettingsTable(db) {
  return new Promise((resolve, reject) => {
    const sql = `
    CREATE TABLE IF NOT EXISTS settings (
      Id INTEGER UNIQUE PRIMARY KEY AUTOINCREMENT NOT NULL,
      serverName TEXT DEFAULT 'lomes' NOT NULL
      timeZone TEXT,
      theme TEXT DEFAULT 'light' NOT NULL,
      movieDirPath TEXT,
      tvShowDirPath TEXT,
      animeDirPath TEXT,
      port INTEGER DEFAULT '6969' NOT NULL,
      
    );
    `;
  })
}

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_NAME, (err) => {
      if (err) {
        console.error('Error connecting to database: ', err.message);
        reject(err);
      } else {
        console.log('Connected to sqlite database');
        resolve(db);
      }
    });
  });
}

let dbPromise;
dbPromise = initializeDatabase()
  .then(async (db) => {
    console.log('Creating tables...');
    return Promise.all([
      createUserTable(db),
      createMoviesTable(db),
      createTvShowsTable(db),
      createSeasonsTable(db),
      createEpisodesTable(db),
      createAnimeTable(db),
      createAnimeEpisode(db),
    ]).then(() => db);
  })
  .catch((err) => {
    console.error('Database initialization failed:', err);
    throw err;
  });

export { dbPromise };
export default dbPromise;
