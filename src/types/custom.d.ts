import { ObjectId } from "bson"

// src/types/custom.ts
export type User = {
    id: ObjectId,
    name: string,
}