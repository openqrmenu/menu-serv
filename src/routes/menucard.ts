import express from "express";
import passport from "passport";
import passportLocal from "passport-local";
import { isAuthenticated } from "../config/passport";
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { MenuCardDataStore, MenuCardObject, MenuLanguage } from "../models/menucard";
import { Status } from "../models/status";
import { ObjectId } from "bson";
import { User } from "../types/custom";
import { MenuCategoryObject, MenuItem, MenuItemDataStore, MenuItemLanguageEntry, MenuOtherPriceEntry } from "../models/menuitem";

const router = express.Router();

router.get("/getall", isAuthenticated, async function(req, res){

  const myuser: User = req.user as User;
  const mcds: MenuCardDataStore = new MenuCardDataStore();
  const existingmcs: Array<MenuCardObject> = await mcds.findAll(myuser.id);
    res.status(200).json(existingmcs);
}
);


router.post("/add", async function (req, res, next) {
  const name = req.body.name;
  let description = req.body.description;
  if (description === undefined)
  {
    description = "";
  }
  const myuser: User = req.user as User;
  console.log(req.user);
  const menucard = MenuCardObject.createNew(name, description, new ObjectId(myuser.id));
  
  const mcds: MenuCardDataStore = new MenuCardDataStore();
  const existingmc: MenuCardObject = await mcds.findByName(name);
  if (existingmc === null)
  {
    const upmenucard = await mcds.add(menucard);
    return res.status(200).json(upmenucard);
  }

  return res.status(409).json(
    new Status(false,"Menu card already exists"));

});

router.post("/delete", async function (req, res, next) {
  const id = new ObjectId(req.body.id);
  const myuser: User = req.user as User;
  const userid = new ObjectId(myuser.id);
  
  const mcds: MenuCardDataStore = new MenuCardDataStore();
  await mcds.deleteById(id, userid);
  return res.status(200).json(new Status(true, ""));
});

router.post("/addlanguage", async function (req, res, next) {
  const id = new ObjectId(req.body.id);
  const code = req.body.code;
  const name = req.body.name;
  const myuser: User = req.user as User;

  const mcds: MenuCardDataStore = new MenuCardDataStore();
  const existingmc: MenuCardObject = await mcds.findByUserId(myuser.id, id);
  console.log(existingmc);

  const ml = new MenuLanguage(code, name);
  existingmc.languages.push(ml);

  await mcds.update(existingmc);

  return res.status(200).json(new Status(true, ""));
});


router.post("/removelanguage", async function (req, res, next) {
  const id = new ObjectId(req.body.id);
  const code = req.body.code;
  const myuser: User = req.user as User;

  const mcds: MenuCardDataStore = new MenuCardDataStore();
  const existingmc: MenuCardObject = await mcds.findByUserId(myuser.id, id);

  const index = existingmc.languages.findIndex(item => item.code === code);
  if (index !== -1)
    existingmc.languages.splice(index, 1);

  await mcds.update(existingmc);

  return res.status(200).json(new Status(true, ""));
});



router.get("/get/:id", isAuthenticated, async function(req, res){

  const myuser: User = req.user as User;
  if (!req.params.hasOwnProperty("id"))
  {
     res.status(400) .json(new Status(false, "Bad Request"));
     return;
  }
  const id = new ObjectId(req.params["id"]);
  const mcds: MenuCardDataStore = new MenuCardDataStore();
  const existingmc: MenuCardObject = await mcds.findByUserId(myuser.id, id);

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

  res.status(200).json(existingmc);
}
);




export default router;