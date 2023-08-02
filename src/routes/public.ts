import express from "express";
import passport from "passport";
import passportLocal from "passport-local";
import { isAuthenticated } from "../config/passport";
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import {
  MenuCardDataStore,
  MenuCardObject,
  MenuLanguage,
} from "../models/menucard";
import { Status } from "../models/status";
import { ObjectId } from "bson";
import { User } from "../types/custom";
import {
  MenuCategoryObject,
  MenuItem,
  MenuItemDataStore,
  MenuItemLanguageEntry,
  MenuOtherPriceEntry,
} from "../models/menuitem";

const router = express.Router();

router.get("/menucard/get/:id", async function (req, res) {
  const id = new ObjectId(req.params["id"]);
  const mcds: MenuCardDataStore = new MenuCardDataStore();
  const existingmc: MenuCardObject = await mcds.findById(id);

  const mids: MenuItemDataStore = new MenuItemDataStore();
  const menuitems = await mids.getMenuItems(existingmc.userid, id);

  const cats = menuitems.filter((item) => {
    if (item.type == "category") return true;
    return false;
  });

  const menucats: MenuCategoryObject[] = [];
  cats.forEach((item) => {
    const subitems = menuitems.filter((mitem) => {
      if (mitem.type != "category" && mitem.parentid == item._id) {
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

  existingmc["items"] = menucats;
  //TODO: Remove unneccessary items from JSON for public view
  /*
  // Sample Category
  const categoryDetail = [ MenuItemLanguageEntry.createNew("en", "Appetizers") ];
  const category = MenuItem.createNew(categoryDetail, new ObjectId("64c2c45ffbe4a246d54ab752"), "category");

  // item 1
  const itemDetail1 = [ MenuItemLanguageEntry.createNew("en", "Chicken 65", "Cubes of Marinated Chicken") ];
  const otherPrice1 = [ MenuOtherPriceEntry.createNew("en", "Large", 14.24), MenuOtherPriceEntry.createNew("en", "Small", 5.6)];
  const item1 = MenuItem.createNew(itemDetail1, new ObjectId("64c2c45ffbe4a246d54ab752"), "item", 25, "usd", "$", otherPrice1);
  
  // item 2
  const itemDetail2 = [ MenuItemLanguageEntry.createNew("en", "Goat Soup", "Goat pieces in a aromatic mix of soup") ];
  const otherPrice2 = [ MenuOtherPriceEntry.createNew("en", "Large", 14.24), MenuOtherPriceEntry.createNew("en", "Small", 5.6)];
  const item2 = MenuItem.createNew(itemDetail2, new ObjectId("64c2c45ffbe4a246d54ab752"), "item", 13, "usd", "$", otherPrice2);
  
  const menuCategory: MenuCategoryObject =  MenuCategoryObject.createNew(category,[item1, item2]);

  // Insert into Menu card
  existingmc["items"] = [ menuCategory ];
  */

  res.status(200).json(existingmc);
});

export default router;
