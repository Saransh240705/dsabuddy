import redisClient from "../config/redis.js";

export async function getCache(key) {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Redis GET Error:", err);
    return null;
  }
}

export async function setCache(key, value, ttl = 300) {
  try {
    await redisClient.set(key, JSON.stringify(value), "EX", ttl);
  } catch (err) {
    console.error("Redis SET Error:", err);
  }
}

export async function deleteCache(key) {
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error("Redis DEL Error:", err);
  }
}

export async function deleteCacheByPattern(pattern) {
  try {
    const keys = await redisClient.keys(pattern);

    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (err) {
    console.error("Redis Pattern Delete Error:", err);
  }
}