import dbPromise from "../index.js";
import { ANIME_DIR, VIDEO_EXT } from "../../constants.js";
import path from "path";
import { promises as fs } from "fs";
import axios from "axios";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const apiQueue = [];
let isProcessingQueue = false;

async function processQueue() {
  if (isProcessingQueue || apiQueue.length === 0) return;

  isProcessingQueue = true;
  while (apiQueue.length > 0) {
    const { func, args, resolve, reject } = apiQueue.shift();
    try {
      const result = await func(...args);
      resolve(result);
    } catch (err) {
      reject(err);
    }
    await delay(1000);
  }
  isProcessingQueue = false;
}

function rateLimitApiCall(func, ...args) {
  return new Promise((resolve, reject) => {
    apiQueue.push({ func, args, resolve, reject });
    processQueue();
  });
}

async function fetchAnimeData(animeName) {
  const url = `${process.env.JIKAN_URI}/anime?q=${encodeURIComponent(animeName)}`;
  console.log(url);
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to fetch the anime details from the api");
    return null;
  }
}

async function fetchEpisodeData(animeMalId, episodeNo) {
  const url = `${process.env.JIKAN_URI}/anime/${animeMalId}/episodes/${episodeNo}`;
  console.log(url)
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to fetch the anime episode details from the api")
    return null;
  }
}

async function addAnimeDataToDatabase(animeData) {
  const db = await dbPromise;
  const sql = `INSERT OR IGNORE INTO anime (animeId, title,type, episodeNo, source, status, description, score, year, studios, genre, posterUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

  const params = [
    animeData[0].mal_id,
    animeData[0].title,
    animeData[0]?.type,
    animeData[0].episodes,
    animeData[0]?.source,
    animeData[0]?.status,
    animeData[0].synopsis,
    animeData[0]?.score,
    animeData[0]?.year,
    animeData[0]?.studios.map(studio => studio.name).join(', '),
    animeData[0]?.genres.map(genre => genre.name).join(', '),
    animeData[0]?.images?.jpg?.image_url,
  ];

  try {
    return new Promise((resolve, reject) => {
      db.run(sql, params, (err) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve();
        }
      })
    });
  } catch (err) {
    console.log("Error inserting the data in the database");
  }
}

async function addAnimeEpisodeDataToDatabase(episodeData, episodePath, animeId) {
  const db = await dbPromise;
  const sql = `INSERT OR IGNORE INTO animeEpisodes (animeId, episodeId, title, description, episodePath) VALUES (?, ?, ?, ?, ?);`

  const params = [
    animeId,
    episodeData.data.mal_id,
    episodeData.data.title,
    episodeData.data.synopsis,
    episodePath
  ];
  console.log(params)

  try {
    return new Promise((resolve, reject) => {
      db.run(sql, params, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      })
    })
  } catch (err) {
    console.log("Error inserting the data in the database", err);
  }
}

async function refreshAnimeDatabase() {
  try {
    const directories = await fs.readdir(ANIME_DIR);
    for (const dir of directories) {
      const animeName = dir;
      console.log(`animeName: ${animeName}`);
      const stats = await fs.stat(path.join(ANIME_DIR, dir));
      const animeData = await rateLimitApiCall(fetchAnimeData, animeName);

      if (animeData) {
        await addAnimeDataToDatabase(animeData.data);
        console.log(`Added the ${animeName} to the database`);
      } else {
        console.error(`Skipped or failed to add the ${animeName} to the database`)
      }

      if (stats.isDirectory()) {
        const episodes = await fs.readdir(path.join(ANIME_DIR, dir))

        if (episodes.length > 0) {
          const animeMalId = animeData.data[0].mal_id;
          for (const ep of episodes) {
            const episodeNo = ep.substring(3, 4);
            const episodePath = path.join(ANIME_DIR, animeName, ep)
            const episodeData = await rateLimitApiCall(fetchEpisodeData, animeMalId, episodeNo);
            console.log(`Episode Number: ${episodeNo}`);

            if (episodeData) {
              await addAnimeEpisodeDataToDatabase(episodeData, episodePath, animeMalId)
              console.log(`Successfully added the ${animeName} episode : ${episodeNo} to the database`);
            } else {
              console.error(`Skipped or failed to add the ${animeName} to the database`);
            }
          }
        }
      }
    }

    res.status(200).json({ message: "Anime database refreshed successfully!" });
  } catch (err) {
    console.log("Error refreshing the anime database", err);
  }
}

export { refreshAnimeDatabase }
