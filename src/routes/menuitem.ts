import express from "express";
import { isAuthenticated } from "../config/passport";
import { Status } from "../models/status";
import { ObjectId } from "bson";
import { User } from "../types/custom";
import { MenuItem, MenuItemDataStore } from "../models/menuitem";

const router = express.Router();

router.post("/add", isAuthenticated, async function (req, res)
{
  const myuser: User = req.user as User;
  const userid = new ObjectId(myuser.id);

  const menuItem = new MenuItem(req.body);
  if (menuItem.type == "category")
    menuItem.parentid = new ObjectId("507f1f77bcf86cd799439011"); // Magic ID
  else
    menuItem.parentid = new ObjectId(menuItem.parentid);
  menuItem.userid = new ObjectId(userid);

  const mids: MenuItemDataStore = new MenuItemDataStore();
  menuItem.order = 1000; // default to add to the end of the list

  mids.addMenuItem(menuItem);
  res.status(200).json(new Status(true));
});

router.post("/update", isAuthenticated, async function (req, res)
{
  const myuser: User = req.user as User;
  const userid = new ObjectId(myuser.id);

  const menuItem = new MenuItem(req.body);
  menuItem.userid = new ObjectId(userid);
  menuItem._id = new ObjectId(menuItem._id as string);

  const mids: MenuItemDataStore = new MenuItemDataStore();

  mids.updateMenuItem(menuItem);
  res.status(200).json(new Status(true));
});

router.post("/delete", async function (req, res, next) {
  const id = new ObjectId(req.body.id);
  const myuser: User = req.user as User;
  const userid = new ObjectId(myuser.id);
  
  const mids: MenuItemDataStore = new MenuItemDataStore();
  await mids.deleteById(id, userid);
  await mids.deleteByParentId(req.body.id, userid);
  return res.status(200).json(new Status(true, ""));
});

export default router;