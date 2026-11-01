import { ObjectId } from "bson";
import { DBCollection } from "../util/db/dbcollection";
import { MONGODB_DB_NAME } from "../util/secrets";

const VIEWS_COLLNAME = "menuviews";
const STATS_CACHE_MS = 10 * 60 * 1000;

export interface PublicStats {
  users: number;
  menus: number;
  liveMenus: number; // menus that have at least one item
  items: number;     // menu items, categories excluded
  viewsLast30Days: number;
  updatedAt: string;
}

let cachedStats: PublicStats | null = null;
let cachedAt = 0;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export class StatsDataStore {

  // Counts one public view of a menu: a running total on the menu card plus a per-day counter.
  // No visitor information (IP, user agent, cookie) is stored.
  async recordView(menucardid: ObjectId): Promise<void>
  {
    await new DBCollection(MONGODB_DB_NAME, "menucards").getCollection()
      .updateOne({ _id: menucardid }, { $inc: { views: 1 } });
    await new DBCollection(MONGODB_DB_NAME, VIEWS_COLLNAME).getCollection()
      .updateOne({ menuid: menucardid, day: today() }, { $inc: { views: 1 } }, { upsert: true });
  }

  // Aggregate numbers for the public landing page. Integers only, cached in memory.
  async getPublicStats(): Promise<PublicStats>
  {
    if (cachedStats && Date.now() - cachedAt < STATS_CACHE_MS)
      return cachedStats;

    const users = new DBCollection(MONGODB_DB_NAME, "users").getCollection();
    const cards = new DBCollection(MONGODB_DB_NAME, "menucards").getCollection();
    const items = new DBCollection(MONGODB_DB_NAME, "menuitems").getCollection();
    const views = new DBCollection(MONGODB_DB_NAME, VIEWS_COLLNAME).getCollection();

    const notCategory = { type: { $ne: "category" } };
    const since = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);

    const [userCount, menuCount, itemCount, live, viewSum] = await Promise.all([
      users.estimatedDocumentCount(),
      cards.estimatedDocumentCount(),
      items.countDocuments(notCategory),
      items.aggregate([{ $match: notCategory }, { $group: { _id: "$menucardid" } }, { $count: "n" }]).toArray(),
      views.aggregate([{ $match: { day: { $gte: since } } }, { $group: { _id: null, n: { $sum: "$views" } } }]).toArray()
    ]);

    cachedStats = {
      users: userCount,
      menus: menuCount,
      liveMenus: live.length ? (live[0].n as number) : 0,
      items: itemCount,
      viewsLast30Days: viewSum.length ? (viewSum[0].n as number) : 0,
      updatedAt: new Date().toISOString()
    };
    cachedAt = Date.now();
    return cachedStats;
  }
}
