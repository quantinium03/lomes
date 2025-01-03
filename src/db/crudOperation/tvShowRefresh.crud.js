import axios from 'axios';
import dbPromise from '../index.js';
import { TVSHOW_DIR } from '../../constants.js';
import fs from 'fs/promises';
import path from 'path';

async function fetchTvShowData(tvShowName) {
  try {
    const response = await axios.get(
      `${process.env.TVMAZE_URI}/singlesearch/shows`,
      {
        params: {
          q: tvShowName,
          embed: 'seasons',
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error('Error fetching TV show info:', err.message);
    return null;
  }
}

async function fetchEpisodeData(tvShowId, episodeNo, seasonNo) {
  console.log(`tvShowId: ${tvShowId}, episodeNo: ${episodeNo}, seasonNo: ${seasonNo}`);

  const url = `https://api.tvmaze.com/shows/${tvShowId}/episodebynumber?season=${seasonNo}&number=${episodeNo}`;
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (err) {
    console.error(
      `Failed to fetch data of tv show with id: ${tvShowId} seasonNo: ${seasonNo} episodeNo: ${episodeNo}`
    );
  }
}

async function addTvShowDatabase(tvShowData) {
  const db = await dbPromise;
  const sql = `INSERT OR IGNORE INTO tvshows (
      tvShowId, title, description, noOfSeasons, premieredData, endedDate, genre, status, rating, posterUrl
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const params_tvshow = [
    tvShowData.id,
    tvShowData.name,
    tvShowData.summary,
    tvShowData._embedded.seasons.length,
    tvShowData?.premiered,
    tvShowData?.ended,
    tvShowData?.genres.toString(),
    tvShowData?.status,
    tvShowData?.rating.average,
    tvShowData?.image?.original ?? tvShowData?.image?.medium,
  ];

  return new Promise((resolve, reject) => {
    db.run(sql, params_tvshow, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

async function addTvShowEpisodeToDatabase(
  tvShowName,
  tvShowId,
  episodeData,
  episodePath
) {
  const db = await dbPromise;
  const sql = `
    INSERT OR IGNORE INTO tvShowsepisodes (tvShowId, tvShowTitle, seasonNumber, episodeNumber,episodeTitle, airDate, airTime, runtime, rating, episodePosterUrl, description, episodePath) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  const ep_params = [
    tvShowId,
    tvShowName,
    episodeData.season,
    episodeData.number,
    episodeData.name,
    episodeData.airDate,
    episodeData.airTime,
    episodeData.runtime,
    episodeData.rating.average,
    episodeData.image.original,
    episodeData.summary,
    episodePath,
  ];

  return new Promise((resolve, reject) => {
    db.run(sql, ep_params, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function addTvShowSeasonToDatabase(tvShowData) {
  const db = await dbPromise;
  const sql = `INSERT OR IGNORE INTO seasons (tvShowId, seasonNumber, seasonPosterUrl, title, description) VALUES (?, ?, ?, ?, ?)`;

  try {
    await db.run('BEGIN TRANSACTION');

    const insertPromises = tvShowData._embedded.seasons.map(async (season) => {
      const params = [
        tvShowData.id,
        season.number,
        season.image?.original ?? season.image?.medium ?? null,
        tvShowData.name,
        season.summary ?? ''
      ];
      try {
        await db.run(sql, params);
      } catch (err) {
        console.error(`Error inserting season ${season.number} for ${tvShowData.name}:`, err);
        throw err;
      }
    });

    await Promise.all(insertPromises);
    await db.run('COMMIT');

  } catch (err) {
    console.error(`Error processing ${tvShowData.name}:`, err);
    await db.run('ROLLBACK');
    throw err;
  }
}

async function refreshTvShowDatabase(req, res) {
  try {
    const files = await fs.readdir(TVSHOW_DIR);
    for (let show of files) {
      const tvShowName = show;
      const seasons = await fs.readdir(path.join(TVSHOW_DIR, tvShowName));

      const tvShowData = await fetchTvShowData(tvShowName);
      if (tvShowData) {
        try {
          await addTvShowDatabase(tvShowData);
          console.log(`${tvShowName} data successfully added`);
        } catch (err) {
          console.error("Failed to add data to the TV database", err.message);
        }

        try {
          await addTvShowSeasonToDatabase(tvShowData);
          console.log(`${tvShowName} seasons data successfully added`);
        } catch (err) {
          console.error("Failed to add season data to the TV database", err.message);
        }
      }

      for (let season of seasons) {
        if (season.startsWith("Season") || season.startsWith("season")) {
          const seasonNo = season.substring(7);
          console.log("SeasonNo : ", seasonNo);

          const episodes = await fs.readdir(
            path.join(TVSHOW_DIR, tvShowName, season)
          );

          for (let episode of episodes) {
            if (episode.startsWith("Episode") || episode.startsWith("episode")) {
              const episodeNo = episode.substring(8, episode.lastIndexOf("."));
              console.log("Episode No: ", episodeNo);

              const tvShowId = tvShowData.id;

              if (episodeNo && seasonNo) {
                const episodeData = await fetchEpisodeData(
                  tvShowId,
                  episodeNo,
                  seasonNo
                );
                console.log(episodeData);

                if (episodeData) {
                  try {
                    await addTvShowEpisodeToDatabase(
                      tvShowName,
                      tvShowId,
                      episodeData,
                      path.join(TVSHOW_DIR, tvShowName, season, episode)
                    );
                    console.log(
                      `Season: ${seasonNo}, Episode: ${episodeNo} successfully added to the database`
                    );
                  } catch (err) {
                    console.error(
                      "Failed to add episode data to the database",
                      err.message
                    );
                  }
                }
              }
            }
          }
        }
      }
    }

    res.status(200).json({ message: "TV Show database refreshed successfully!" });
  } catch (err) {
    console.error("Error refreshing the database: ", err.message);
    res.status(500).json({ error: "Error refreshing the TV Show database." });
  }
}

export { refreshTvShowDatabase };
