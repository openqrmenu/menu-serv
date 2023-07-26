import { DBCollection } from "../util/db/dbcollection";
import { MONGODB_DB_NAME } from "../util/secrets";
import logger from "../util/logger";

export class AnyObject {
  [prop: string]: unknown; // Prevent Weak Type errors https://mariusschulz.com/blog/weak-type-detection-in-typescript
  constructor(source: Partial<AnyObject>)
  {
    Object.assign(this, source);
  }
}

const COLLNAME = "haiku";

export async function doanyinsert(anyob: AnyObject): Promise<void> {
  try {
    const dbcoll = new DBCollection(MONGODB_DB_NAME, COLLNAME);
    const result = await dbcoll.getCollection().insertOne(anyob);
     logger.debug(`A document was inserted with the _id: ${result.insertedId}`);

  } finally {
  }
}


    
