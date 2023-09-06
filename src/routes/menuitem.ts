import express from "express";
import { isAuthenticated } from "../config/passport";
import { Status } from "../models/status";
import { ObjectId } from "bson";
import { User } from "../types/custom";
import { MenuItem, MenuItemDataStore } from "../models/menuitem";
import { body, validationResult, ValidationError, Result } from "express-validator";
import { validationErrorMsg } from "../util/validation";

const router = express.Router();

router.post("/add", isAuthenticated, 
body("menucardid").trim().escape().isMongoId(),
body("parentid").trim().escape().isMongoId(),
body("type").trim().escape().notEmpty(),
body("price").trim().escape().isNumeric(),
body("enabled").trim().escape().isBoolean(),
body("details").notEmpty(),
async function (req, res)
{
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json(new Status(false, validationErrorMsg(result)));
  }

  const myuser: User = req.user as User;
  const userid = new ObjectId(myuser.id);

  const menuItem = new MenuItem(req.body);
  if (menuItem.type == "category")
    menuItem.parentid = new ObjectId("507f1f77bcf86cd799439011"); // Magic ID
  else
    menuItem.parentid = new ObjectId(menuItem.parentid);
  menuItem.userid = new ObjectId(userid);
  menuItem.enabled = (req.body.enabled == "true") ? true : false;

  const mids: MenuItemDataStore = new MenuItemDataStore();
  menuItem.order = 1000; // default to add to the end of the list

  mids.addMenuItem(menuItem);
  res.status(200).json(new Status(true));
});

router.post("/update", isAuthenticated, 
body("_id").trim().escape().isMongoId(),
body("menucardid").trim().escape().isMongoId(),
body("parentid").trim().escape().isMongoId(),
body("type").trim().escape().notEmpty(),
body("price").trim().escape().isNumeric(),
body("enabled").trim().escape().isBoolean(),
body("details").notEmpty(),
async function (req, res)
{
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json(new Status(false, validationErrorMsg(result)));
  }

  console.log(req.body);

  const myuser: User = req.user as User;
  const userid = new ObjectId(myuser.id);

  const menuItem = new MenuItem(req.body);
  menuItem.userid = new ObjectId(userid); // Override UserID
  menuItem._id = new ObjectId(menuItem._id as string);
  menuItem.enabled = (req.body.enabled == "true") ? true : false;

  console.log(menuItem);
  const mids: MenuItemDataStore = new MenuItemDataStore();

  mids.updateMenuItem(menuItem);
  res.status(200).json(new Status(true));
});

router.post("/delete", isAuthenticated, 
body("id").trim().escape().isMongoId(),
async function (req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json(new Status(false, validationErrorMsg(result)));
  }

  const id = new ObjectId(req.body.id);
  const myuser: User = req.user as User;
  const userid = new ObjectId(myuser.id);
  
  const mids: MenuItemDataStore = new MenuItemDataStore();
  await mids.deleteById(id, userid);
  await mids.deleteByParentId(req.body.id, userid);
  return res.status(200).json(new Status(true, ""));
});

export default router;