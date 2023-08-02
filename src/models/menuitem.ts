import { ObjectId } from "bson";
import { DBCollection } from "../util/db/dbcollection";
import { MONGODB_DB_NAME } from "../util/secrets";
import logger from "../util/logger";


export class MenuOtherPriceEntry
{
    [prop: string]: unknown; // Prevent Weak Type errors https://mariusschulz.com/blog/weak-type-detection-in-typescript

    language: string;
    description: string;
    price: number;

    constructor(source: Partial<MenuOtherPriceEntry>)
    {
      Object.assign(this, source);
    }

    public static createNew(language: string, description: string, price: number) : MenuOtherPriceEntry
    {
      return new MenuOtherPriceEntry({
        language: language,
        description: description,
        price: price
      });
    }
}

export class MenuItemLanguageEntry
{
    [prop: string]: unknown; // Prevent Weak Type errors https://mariusschulz.com/blog/weak-type-detection-in-typescript

    language: string;
    name: string;
    description: string;

    constructor(source: Partial<MenuItemLanguageEntry>)
    {
      Object.assign(this, source);
    }

    public static createNew(language: string, name: string, description: string = "") : MenuItemLanguageEntry
    {
      return new MenuItemLanguageEntry({
        language: language,
        name: name,
        description: description
      });
    }
}

export class MenuItem{
    [prop: string]: unknown; // Prevent Weak Type errors https://mariusschulz.com/blog/weak-type-detection-in-typescript

    details: MenuItemLanguageEntry[];
    userid: ObjectId;
    menucardid: ObjectId;
    parentid: ObjectId;
    type: string;

    price: number;

    otherprice: MenuOtherPriceEntry[]    

    
    constructor(source: Partial<MenuItem>)
    {
      Object.assign(this, source);
      if (typeof this.menucardid  === "string")
        this.menucardid = new ObjectId(this.menucardid);
    }
  
    public static createNew(details: MenuItemLanguageEntry[], userid: ObjectId, type: string, 
        price: number = 0) : MenuItem
    {
      return new MenuItem({
       details: details,
        userid: userid,
        type: type,
        price: price
      });
    }
    
    
}

export class MenuCategoryObject {
  [prop: string]: unknown; // Prevent Weak Type errors https://mariusschulz.com/blog/weak-type-detection-in-typescript

  category: MenuItem;

  menuitems: MenuItem[];
  constructor(source: Partial<MenuCategoryObject>)
  {
    Object.assign(this, source);
  }

  public static createNew(category: MenuItem, menuItems: MenuItem[]) : MenuCategoryObject
  {
    return new MenuCategoryObject({
     category: category,
      menuitems: menuItems
    });
  }
}

const COLLNAME = "menuitems";

export class MenuItemDataStore {

    async  addMenuItem(menuItem: MenuItem): Promise<MenuItem> {
        try {
          const dbcoll = new DBCollection(MONGODB_DB_NAME, COLLNAME);
          const result = await dbcoll.getCollection().insertOne(menuItem);
          logger.debug(`A document was inserted with the _id: ${result.insertedId}`);
          return menuItem;
        } finally {
        }
      }


      async deleteById(id: ObjectId, userid: ObjectId): Promise<void> {
        try {
          const query = { _id: new ObjectId(id), userid: new ObjectId(userid) };
          console.log(query);
          const dbcoll = new DBCollection(MONGODB_DB_NAME, COLLNAME);
          const result = await dbcoll.getCollection().deleteOne(query);
          if (result.deletedCount === 1)
            logger.debug(`A document was deleted with the _id: ${id}`);
          else
            logger.debug("No documents found to delete");
        } finally {
        }
      }
      


  async getMenuItems(auserid: ObjectId, amenucardid: ObjectId): Promise<Array<MenuItem>>
  {
    const query = { userid: new ObjectId(auserid), menucardid:  new ObjectId(amenucardid) };
    const dbcoll = new DBCollection(MONGODB_DB_NAME, COLLNAME);
    console.log(query);
    const cursor = await dbcoll.getCollection().find(query);
    const menuitems: MenuItem[] = [];
    let obj;
    while (await cursor.hasNext())
    {
      obj = await cursor.next();
      const menuitem = new MenuItem(obj);  
      menuitems.push(menuitem);
    }
    return menuitems;
  }

    async updateMenuItem(menuItem: MenuItem): Promise<any> {
    try {
      const query = { _id: menuItem._id, userid: new ObjectId(menuItem.userid) };
      const options = { upsert: true };
      const dbcoll = new DBCollection(MONGODB_DB_NAME, COLLNAME);
      delete menuItem._id;
      const updateDoc = { $set: menuItem};
      const result = await dbcoll.getCollection().updateOne(query, updateDoc, options);
      if (result.modifiedCount > 0)
        logger.debug("A document was updated with the _id");
      else
        logger.debug("No document found for update");
    } finally {
    }
  }
}



    
