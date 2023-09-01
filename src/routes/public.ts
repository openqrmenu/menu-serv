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
import { param, body, validationResult, ValidationError, Result } from "express-validator";
import { validationErrorMsg } from "../util/validation";


const router = express.Router();

router.get("/menucard/get/:id", 
param("id").trim().escape().isMongoId(),
async function (req, res) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json(new Status(false, validationErrorMsg(result)));
  }

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

  existingmc["items"] = menucats;
  //TODO: Remove unneccessary items from JSON for public view
  res.status(200).json(existingmc);
});

export default router;
