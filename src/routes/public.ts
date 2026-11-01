import express from "express";
import {
  MenuCardDataStore,
  MenuCardObject
} from "../models/menucard";
import { Status } from "../models/status";
import { ObjectId } from "bson";
import {
  MenuCategoryObject,
  MenuItemDataStore,
} from "../models/menuitem";
import { StatsDataStore } from "../models/stats";
import { User } from "../types/custom";
import { param, body, validationResult, ValidationError, Result } from "express-validator";
import { validationErrorMsg } from "../util/validation";
import { publicStatsLimiter } from "../util/ratelimit";
import logger from "../util/logger";


const router = express.Router();

// Crawlers and uptime checkers should not inflate the view counters
const BOT_USER_AGENT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|monitor|uptime|curl|wget|python-requests|headless|lighthouse/i;

router.get("/menucard/get/:id",
param("id").trim().escape().isMongoId(),
async function (req, res) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json(new Status(false, validationErrorMsg(result)));
  }

  try {
    const id = new ObjectId(req.params["id"]);
    const mcds: MenuCardDataStore = new MenuCardDataStore();
    const existingmc: MenuCardObject = await mcds.findById(id);
    if (existingmc === null) {
      return res.status(404).json(new Status(false, "Menu not found"));
    }

    const mids: MenuItemDataStore = new MenuItemDataStore();
    const menuitems = await mids.getMenuItems(existingmc.userid, id);

    const cats = menuitems.filter((item) => {
      if (item.type == "category") return true;
      return false;
    });

    const menucats: MenuCategoryObject[] = [];
    cats.forEach((item) => {
      const subitems = menuitems.filter((mitem) => {
        if (mitem.type != "category" && mitem.parentid.toString() == item._id.toString()) {
          return true;
        }
        return false;
      });

      const menuCategory: MenuCategoryObject = MenuCategoryObject.createNew(
        item,
        subitems
      );
      menucats.push(menuCategory);
    });

    // Count the view, but not for the owner previewing their own menu or for bots
    const ua = req.get("user-agent") || "";
    const myuser = req.user as User;
    const isOwner = req.isAuthenticated() && myuser && String(myuser.id) === String(existingmc.userid);
    if (!isOwner && ua && !BOT_USER_AGENT.test(ua)) {
      new StatsDataStore().recordView(id).catch((err) => logger.error(err));
    }

    // Public view: owner ids and internal counters are not part of the response
    delete existingmc.userid;
    delete existingmc.views;
    menucats.forEach((cat) => {
      delete cat.category.userid;
      cat.menuitems.forEach((mitem) => delete mitem.userid);
    });

    existingmc["items"] = menucats;
    res.status(200).json(existingmc);
  } catch (err) {
    logger.error(err);
    res.status(500).json(new Status(false, "Unable to load menu"));
  }
});

// Aggregate counts for the public landing page. Numbers only, cached server side.
router.get("/stats", publicStatsLimiter, async function (req, res) {
  try {
    const stats = await new StatsDataStore().getPublicStats();
    res.set("Cache-Control", "public, max-age=300");
    res.status(200).json(stats);
  } catch (err) {
    logger.error(err);
    res.status(500).json(new Status(false, "Stats unavailable"));
  }
});

export default router;
