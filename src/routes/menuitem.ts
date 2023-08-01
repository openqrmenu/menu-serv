import express from "express";
import passport from "passport";
import passportLocal from "passport-local";
import { isAuthenticated } from "../config/passport";
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { MenuCardDataStore, MenuCardObject } from "../models/menucard";
import { Status } from "../models/status";
import { ObjectId } from "bson";
import { User } from "../types/custom";
import { MenuCategoryObject, MenuItem, MenuItemDataStore, MenuItemLanguageEntry, MenuOtherPriceEntry } from "../models/menuitem";

const router = express.Router();


router.post("/add", isAuthenticated, async function (req, res)
{
  const myuser: User = req.user as User;
  const userid = new ObjectId(myuser.id);

  console.log(req.body);
  const menuItem = new MenuItem(req.body);
  //menuItem.type = "category";
  menuItem.userid = new ObjectId(userid);

  const mids: MenuItemDataStore = new MenuItemDataStore();

  mids.addMenuItem(menuItem);
  console.log(menuItem);
  res.status(200).json(new Status(true));
  
  
}
);

router.post("/update", isAuthenticated, async function (req, res)
{
  const myuser: User = req.user as User;
  const userid = new ObjectId(myuser.id);

  console.log(req.body);
  const menuItem = new MenuItem(req.body);
  menuItem.userid = new ObjectId(userid);
  menuItem._id = new ObjectId(menuItem._id as string);

  const mids: MenuItemDataStore = new MenuItemDataStore();

  mids.updateMenuItem(menuItem);
  console.log(menuItem);
  res.status(200).json(new Status(true));
  
  
}
);

router.post("/delete", async function (req, res, next) {
  const id = new ObjectId(req.body.id);
  const myuser: User = req.user as User;
  const userid = new ObjectId(myuser.id);
  
  const mids: MenuItemDataStore = new MenuItemDataStore();
  await mids.deleteById(id, userid);
  return res.status(200).json(new Status(true, ""));
});

export default router;