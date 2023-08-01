import { ObjectId } from "bson";
import { DBCollection } from "../util/db/dbcollection";
import { MONGODB_DB_NAME } from "../util/secrets";
import logger from "../util/logger";

export class MenuLanguage {
  code: string;
  name: string;

  constructor(code: string, name: string)
  {
    this.code = code;
    this.name = name;
  }

}

export class MenuCardObject {
  [prop: string]: unknown; // Prevent Weak Type errors https://mariusschulz.com/blog/weak-type-detection-in-typescript

  name: string;
  description: string;
  updated: Date;

  count: number;

  views: number;

  userid: ObjectId;

  languages: MenuLanguage[];
  constructor(source: Partial<MenuCardObject>)
  {
    Object.assign(this, source);
  }

  public static createNew(name: string, description: string, userid: ObjectId) : MenuCardObject
  {
    const english = new MenuLanguage("en", "English");
    const langs: MenuLanguage[] = [ english ];
    return new MenuCardObject({
      name: name,
      description: description,
      updated: new Date(),
      userid: userid,
      views: 0,
      languages: langs
    });
  }
}

const COLLNAME = "menucards";

export class MenuCardDataStore {

  async findByName(name: string): Promise<MenuCardObject>
  {
    const query = { name: name };
    const dbcoll = new DBCollection(MONGODB_DB_NAME, COLLNAME);
    const obj = await dbcoll.getCollection().findOne(query);
    if (obj === null)
      return null;
    const menucard = new MenuCardObject(obj);
    return menucard;
  }

  async findAll(auserid: ObjectId): Promise<Array<MenuCardObject>>
  {
    const query = { userid: new ObjectId(auserid) };
    const dbcoll = new DBCollection(MONGODB_DB_NAME, COLLNAME);
    console.log(query);
    const cursor = await dbcoll.getCollection().find(query);
    const menucards: MenuCardObject[] = [];
    let obj;
    while (await cursor.hasNext())
    {
      obj = await cursor.next();
      
      const menucard = new MenuCardObject(obj);  
      menucards.push(menucard);

    }
    return menucards;
  }

  async findByUserId(userid: ObjectId, id: ObjectId): Promise<MenuCardObject>
  {
    const query = { userid: new ObjectId(userid), _id: new ObjectId(id) };
    const dbcoll = new DBCollection(MONGODB_DB_NAME, COLLNAME);
    const obj = await dbcoll.getCollection().findOne(query);
    const menucard = new MenuCardObject(obj);
    logger.debug(menucard);
    return menucard;
  }

  async findById(id: ObjectId): Promise<MenuCardObject>
  {
    const query = { _id: id };
    const dbcoll = new DBCollection(MONGODB_DB_NAME, COLLNAME);
    const obj = await dbcoll.getCollection().findOne(query);
    const menucard = new MenuCardObject(obj);
    logger.debug(menucard);
    return menucard;
  }

  async  add(menucard: MenuCardObject): Promise<MenuCardObject> {
    try {
      const dbcoll = new DBCollection(MONGODB_DB_NAME, COLLNAME);
      const result = await dbcoll.getCollection().insertOne(menucard);
      logger.debug(`A document was inserted with the _id: ${result.insertedId}`);
      //menucard.id = new ObjectId(result.insertedId);
      return menucard;
    } finally {
    }
  }

    async update(menucard: MenuCardObject): Promise<any> {
    try {
      const query = { _id: menucard._id };
      const options = { upsert: true };
      const dbcoll = new DBCollection(MONGODB_DB_NAME, COLLNAME);
      delete menucard._id;
      const updateDoc = { $set: menucard};
      const result = await dbcoll.getCollection().updateOne(query, updateDoc, options);
      if (result.modifiedCount > 0)
        logger.debug("A document was updated with the _id");
      else
        logger.debug("No document found for update");
    } finally {
    }
  }

  async deleteById(id: ObjectId, userid: ObjectId): Promise<void> {
    try {
      const query = { _id: new ObjectId(id), userid: new ObjectId(userid) };
      const dbcoll = new DBCollection(MONGODB_DB_NAME, COLLNAME);
      const result = await dbcoll.getCollection().deleteOne(query);
      if (result.deletedCount === 1)
        logger.debug(`A document was deleted with the _id: ${id}`);
      else
        logger.debug("No documents found to delete");
    } finally {
    }
  }
  
}



    
