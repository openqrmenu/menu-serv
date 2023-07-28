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

const router = express.Router();

router.get("/get", isAuthenticated, async function(req, res){

  const myuser: User = req.user as User;
  const mcds: MenuCardDataStore = new MenuCardDataStore();
  const existingmcs: Array<MenuCardObject> = await mcds.findAll(myuser.id);
    res.status(200).json(existingmcs);
}
);


router.post("/add", async function (req, res, next) {
  const name = req.body.name;
  const description = req.body.description;
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

export default router;