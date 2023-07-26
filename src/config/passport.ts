import passport from "passport";
import passportLocal from "passport-local";


import { Request, Response, NextFunction } from "express";
import { UserDataStore, UserObject } from "../models/user";
import bcrypt from "bcrypt";


/* Configure password authentication strategy.
 *
 * The `LocalStrategy` authenticates users by verifying a username and password.
 * The strategy parses the username and password from the request and calls the
 * `verify` function.
 *
 * The `verify` function queries the database for the user record and verifies
 * the password by hashing the password supplied by the user and comparing it to
 * the hashed password stored in the database.  If the comparison succeeds, the
 * user is authenticated; otherwise, not.
 */
const LocalStrategy = passportLocal.Strategy;
passport.use(
  new LocalStrategy(async function verify(username, password, cb) {
    const uds: UserDataStore = new UserDataStore();
    const user: UserObject = await uds.findByName(username);
    if (bcrypt.compareSync(password, user.hash_password)) {
      return cb(null, { id: user._id, username: username });
    }

    return cb(null, false, { message: "Incorrect username or password" });
  })
);


/* Configure session management.
 *
 * When a login session is established, information about the user will be
 * stored in the session.  This information is supplied by the `serializeUser`
 * function, which is yielding the user ID and username.
 *
 * As the user interacts with the app, subsequent requests will be authenticated
 * by verifying the session.  The same user information that was serialized at
 * session establishment will be restored when the session is authenticated by
 * the `deserializeUser` function.
 *
 * Since every request to the app needs the user ID and username, in order to
 * fetch todo records and render the user element in the navigation bar, that
 * information is stored in the session.
 */
passport.serializeUser(function (
  req: Request,
  user: any,
  cb: CallableFunction
) {
  process.nextTick(function () {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
};