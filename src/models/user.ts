import { ObjectId } from "bson";
import { DBCollection } from "../util/db/dbcollection";
import { MONGODB_DB_NAME } from "../util/secrets";
import logger from "../util/logger";

export class UserObject {
  [prop: string]: unknown; // Prevent Weak Type errors https://mariusschulz.com/blog/weak-type-detection-in-typescript

  name: string;
  hash_password: string;
constructor(source: Partial<UserObject>)
  {
    Object.assign(this, source);
  }
}

const COLLNAME = "users";

export class UserDataStore {

  async doStuff(): Promise<void>
  {
    const user = new UserObject({
      name: "full",
      hash_password: "world",
    });
    this.add(user);

    this.deleteById(new ObjectId("64ba9f5f9fbc0cdb5c0a4c17"));

    const myuser = await this.findByName("joking");
    logger.debug(myuser);

    myuser.type = "bad134" + Math.random();
    await this.update(myuser);
  }

  async findByName(aname: string): Promise<UserObject>
  {
    const query = { name: aname };
    const dbcoll = new DBCollection(MONGODB_DB_NAME, COLLNAME);
    const obj = await dbcoll.getCollection().findOne(query);
    if (obj === null)
      return null;
    const user = new UserObject(obj);
    return user;
  }

  async findById(id: ObjectId): Promise<UserObject>
  {
    const query = { _id: id };
    const dbcoll = new DBCollection(MONGODB_DB_NAME, COLLNAME);
    const obj = await dbcoll.getCollection().findOne(query);
    const user = new UserObject(obj);
    logger.debug(user);
    return user;
  }

  async  add(user: UserObject): Promise<void> {
    try {
      const dbcoll = new DBCollection(MONGODB_DB_NAME, COLLNAME);
      const result = await dbcoll.getCollection().insertOne(user);
      logger.debug(`A document was inserted with the _id: ${result.insertedId}`);
    } finally {
    }
  }

    async update(user: UserObject): Promise<any> {
    try {
      const query = { _id: user._id };
      const options = { upsert: true };
      const dbcoll = new DBCollection(MONGODB_DB_NAME, COLLNAME);
      delete user._id;
      const updateDoc = { $set: user};
      const result = await dbcoll.getCollection().updateOne(query, updateDoc, options);
      if (result.modifiedCount > 0)
        logger.debug("A document was updated with the _id");
      else
        logger.debug("No document found for update");
    } finally {
    }
  }

  async deleteById(id: ObjectId): Promise<void> {
    try {
      const query = { _id: id };
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



    
