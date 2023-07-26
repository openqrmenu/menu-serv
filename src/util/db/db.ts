import { MongoClient, Db, Collection } from "mongodb";
import { MONGODB_URI } from "../secrets";

class DB {
    dbURI = MONGODB_URI;
    mongodbclient: MongoClient;
    constructor(mongodburi: string = MONGODB_URI)
    {
        this.dbURI = mongodburi;
        this.mongodbclient = new MongoClient(this.dbURI);
    }

    getDB(dbname: string): Db {
        return this.mongodbclient.db(dbname);
    }

    getCollection(database: Db, collname: string): Collection {
        return database.collection(collname);
    }

    getDBCollection(dbname: string, collname: string): Collection{
        return this.mongodbclient.db(dbname).collection(collname);
    }

    getMongoClient(): MongoClient{
        return this.mongodbclient;
    }

    async connect()
    {
        await this.mongodbclient.connect();
    }

    async close()
    {
        await this.mongodbclient.close();
    }
}

const DBStore = new DB(); 
export default DBStore;