import {  Collection, Document } from "mongodb";
import StoreDB from "./db";

export class DBCollection {
    selcollection: Collection<Document>;
    constructor(dbname: string, collname: string)
    {
        this.selcollection = StoreDB.getDBCollection(dbname, collname);
    }

    getCollection(): Collection<Document>
    {
        return this.selcollection;
    }
}
