import logger from "./logger";
import dotenv from "dotenv";
import fs from "fs";

if (fs.existsSync(".env")) {
    logger.debug("Using .env file to supply config environment variables");
    dotenv.config({ path: ".env" });
} else {
    logger.debug("Using .env.example file to supply config environment variables");
    dotenv.config({ path: ".env.example" });  // you can delete this after you create your own .env file!
}
export const ENVIRONMENT = process.env.NODE_ENV;
export const ISPRODUCTION = ENVIRONMENT === "production"; // Anything else is treated as 'dev'

export const SESSION_SECRET = process.env["SESSION_SECRET"];
export const MONGODB_URI = ISPRODUCTION ? process.env["MONGODB_URI"] : process.env["MONGODB_URI_LOCAL"];

export const MONGODB_DB_NAME = process.env["MONGODB_DB_NAME"];

if (!SESSION_SECRET) {
    logger.error("No client secret. Set SESSION_SECRET environment variable.");
    process.exit(1);
}

if (!MONGODB_URI) {
    if (ISPRODUCTION) {
        logger.error("No mongo connection string. Set MONGODB_URI environment variable.");
    } else {
        logger.error("No mongo connection string. Set MONGODB_URI_LOCAL environment variable.");
    }
    process.exit(1);
}

export const GOOGLE_CLIENT_ID = process.env["GOOGLE_CLIENT_ID"];

export const GOOGLE_CLIENT_SECRET = process.env["GOOGLE_CLIENT_SECRET"];

export const OTP_JWT_SECRET = process.env["OTP_JWT_SECRET"];

export const APP_URL = process.env["APP_URL"];