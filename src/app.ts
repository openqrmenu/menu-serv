import express from "express";
import compression from "compression";  // compresses requests
import session from "express-session";
import lusca from "lusca";
import path from "path";
import passport from "passport";
import morgan from "morgan";
import createMemoryStore from "memorystore";
import MongoStore from "connect-mongo";
import cors from "cors";

import cookieparser from "cookie-parser";
import { SESSION_SECRET, MONGODB_URI, MONGODB_DB_NAME, ISPRODUCTION } from "./util/secrets";
import logger from "./util/logger";

import DBStore from "./util/db/db";

import indexRouter from "./routes/index";
import authRouter from "./routes/auth";

/*
process.on("uncaughtException", function (exception) {
  logger.error(exception); 
});
*/

// Create Express server
const app = express();

// Connect to MongoDB
DBStore.connect();

const mclient: MongoClient = DBStore.getMongoClient();

// TEMP TEST
import {UserDataStore} from "./models/user";
import { MongoClient } from "mongodb";
const uds = new UserDataStore();
//uds.doStuff();

const MemoryStore = createMemoryStore(session);

// Express configuration
app.use(morgan("dev", { stream: {
        write: (message) => logger.debug(message.trim())
    }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieparser());
app.use(express.static(path.join(__dirname, "public")));
app.set("port", process.env.PORT || 3000);
app.use(compression());
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: SESSION_SECRET,
    cookie : {
    },
    store:  MongoStore.create( { mongoUrl: MONGODB_URI, dbName: MONGODB_DB_NAME}  )
}));
app.use(passport.initialize());
app.use(passport.session());

if (!ISPRODUCTION) // UI Development mode
{
  app.use(cors({
    credentials: true,
    origin: ["http://localhost:4000"] // 
  }));
  }

// LUSCA options
//app.use(lusca.xframe("SAMEORIGIN"));
//app.use(lusca.xssProtection(true));
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

/*
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.set('Content-Type', 'text/html');
  res.send(Buffer.from('<h2>404 Not Found1</h2>'));
});
*/

// ROUTE HANDLERS
//app.use("/", indexRouter);
app.use("/auth", authRouter);

export default app;