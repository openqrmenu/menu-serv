import express from "express";
import { isAuthenticated } from "../config/passport";
import { MenuCardDataStore, MenuCardObject, MenuLanguage } from "../models/menucard";
import { Status } from "../models/status";
import { ObjectId } from "bson";
import { User } from "../types/custom";
import { MenuCategoryObject, MenuItem, MenuItemDataStore, MenuItemLanguageEntry, MenuOtherPriceEntry } from "../models/menuitem";
import { body, param, validationResult, ValidationError, Result } from "express-validator";
import { validationErrorMsg } from "../util/validation";

const router = express.Router();

router.get("/getall", isAuthenticated, async function(req, res){
  const myuser: User = req.user as User;
  const mcds: MenuCardDataStore = new MenuCardDataStore();
  const existingmcs: Array<MenuCardObject> = await mcds.findAll(myuser.id);
  res.status(200).json(existingmcs);
});

router.post("/add", isAuthenticated, 
body("name").trim().escape().notEmpty(),
body("description").trim(),
body("currency").trim(),
body("languages").notEmpty(),
async function (req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json(new Status(false, validationErrorMsg(result)));
  }

  const menucard = new MenuCardObject(req.body);
  const myuser: User = req.user as User;
  menucard.userid = new ObjectId(myuser.id);
  menucard.updated = new Date();
    
  const mcds: MenuCardDataStore = new MenuCardDataStore();
  const existingmc: MenuCardObject = await mcds.findByName(myuser.id, menucard.name);
  if (existingmc === null)
  {
    const upmenucard = await mcds.add(menucard);
    return res.status(200).json(upmenucard);
  }

  return res.status(409).json(
    new Status(false,"Menu card already exists, choose another one"));

});

router.post("/update", isAuthenticated, 
body("name").trim().escape().notEmpty(),
body("description").trim(),
body("currency").trim(),
body("languages").notEmpty(),
async function (req, res)
{
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json(new Status(false, validationErrorMsg(result)));
  }

  const myuser: User = req.user as User;
  const userid = new ObjectId(myuser.id);

  const menucard = new MenuCardObject(req.body);
  menucard.userid = new ObjectId(myuser.id);
  menucard.updated = new Date();
  menucard._id = new ObjectId(menucard._id as string); // convert JSON string to objectId

  const mcds: MenuCardDataStore = new MenuCardDataStore();

  mcds.update(myuser.id, menucard);
  res.status(200).json(new Status(true, ""));
});

// Update Ordering for the entire menu item and update the values in the database
// TODO: Skip item update when order hasn't changed
router.post("/updatednd", isAuthenticated, 
body("name").trim().escape().notEmpty(),
body("description").trim(),
body("currency").trim(),
body("languages").notEmpty(),
body("items").notEmpty(),
async function (req, res)
{
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json(new Status(false, validationErrorMsg(result)));
  }

  const myuser: User = req.user as User;
  const userid = new ObjectId(myuser.id);

  const menucard = new MenuCardObject(req.body);
  menucard.userid = new ObjectId(myuser.id);
  menucard.updated = new Date();
  menucard._id = new ObjectId(menucard._id as string); // convert JSON string to objectId

  // Add the ordering info
  const mids: MenuItemDataStore = new MenuItemDataStore();
  const menucats: any = menucard["items"];
  let order = 0;
  menucats.forEach((item: { [x: string]: any; }) => {
    item["category"].order = order;
    order++;

    const catItem = new MenuItem(item["category"]);
    catItem._id = new ObjectId(catItem._id as string);
    catItem.userid = new ObjectId(userid);
    catItem.parentid = new ObjectId(catItem.parentid);
    mids.updateMenuItem(catItem);
    
    const items = item["menuitems"];
    items.forEach((subitem: Partial<MenuItem>) => {
      subitem.order = order;
      order++;

      const subMenuItem = new MenuItem(subitem);
      subMenuItem._id = new ObjectId(subMenuItem._id as string);
      subMenuItem.userid = new ObjectId(userid);
      subMenuItem.parentid = new ObjectId(subMenuItem.parentid);
      mids.updateMenuItem(subMenuItem);
    });
  });
  
  res.status(200).json(new Status(true, ""));
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
  
  const mcds: MenuCardDataStore = new MenuCardDataStore();
  await mcds.deleteById(id, userid);

  const mids: MenuItemDataStore = new MenuItemDataStore();
  await mids.deleteByMenuCardId(id, userid);

  return res.status(200).json(new Status(true, ""));
});

router.post("/addlanguage", isAuthenticated, 
body("code").trim().escape().notEmpty(),
body("name").trim().escape().notEmpty(),
async function (req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json(new Status(false, validationErrorMsg(result)));
  }

  const id = new ObjectId(req.body.id);
  const code = req.body.code;
  const name = req.body.name;
  const myuser: User = req.user as User;

  const mcds: MenuCardDataStore = new MenuCardDataStore();
  const existingmc: MenuCardObject = await mcds.findByUserId(myuser.id, id);
  const ml = new MenuLanguage(code, name);
  existingmc.languages.push(ml);

  await mcds.update(myuser.id, existingmc);

  return res.status(200).json(new Status(true, ""));
});


router.post("/removelanguage", isAuthenticated, 
body("code").trim().escape().notEmpty(),
async function (req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json(new Status(false, validationErrorMsg(result)));
  }

  const id = new ObjectId(req.body.id);
  const code = req.body.code;
  const myuser: User = req.user as User;

  const mcds: MenuCardDataStore = new MenuCardDataStore();
  const existingmc: MenuCardObject = await mcds.findByUserId(myuser.id, id);

  const index = existingmc.languages.findIndex(item => item.code === code);
  if (index !== -1)
    existingmc.languages.splice(index, 1);

  await mcds.update(myuser.id, existingmc);

  return res.status(200).json(new Status(true, ""));
});


router.get("/get/:id", isAuthenticated, 
param("id").trim().escape().isMongoId(),
async function(req, res){
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json(new Status(false, validationErrorMsg(result)));
  }
  
  const myuser: User = req.user as User;
  if (!req.params.hasOwnProperty("id"))
  {
     res.status(400) .json(new Status(false, "Bad Request"));
     return;
  }
  const id = new ObjectId(req.params["id"]);
  const mcds: MenuCardDataStore = new MenuCardDataStore();
  const existingmc: MenuCardObject = await mcds.findByUserId(myuser.id, id);

  const mids: MenuItemDataStore = new MenuItemDataStore();
  const menuitems = await mids.getMenuItems(myuser.id, id);
  //console.log(menuitems);

  const cats = menuitems.filter(item => {
    if (item.type == "category")
      return true;
    return false;
  });
  const menucats: MenuCategoryObject[] = [];
  cats.forEach(item => {
    const subitems = menuitems.filter(mitem => {
        if (mitem.type != "category" && mitem.parentid.toString() == item._id.toString())
        {
          return true;
        }

        return false;
    });

    const menuCategory: MenuCategoryObject =  MenuCategoryObject.createNew(item,subitems);
    menucats.push(menuCategory);
  });

  
  existingmc["items"] = menucats;
  res.status(200).json(existingmc);
});
export default router;