import passport from "passport";
import passportLocal from "passport-local";
import passportGoogle from "passport-google-oauth20";

import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "../util/secrets";


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
  new LocalStrategy({usernameField: "email", passwordField: "password"}, async function verify(email, password, cb) {
    const uds: UserDataStore = new UserDataStore();
    const user: UserObject = await uds.findByEmail(email);
    if (user === null)
      return cb(null, false, { message: "Incorrect username or password" });

    if (bcrypt.compareSync(password, user.hash_password)) {
      return cb(null, user);
    }

    return cb(null, false, { message: "Incorrect username or password" });
  })
);

const GoogleStrategy = passportGoogle.Strategy;
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: "http://goqrmenu.com:3000/auth/redirect/google",
  scope: [ "profile" ],
  state: true
},
async function(accessToken, refreshToken, profile, cb) {
    // get profile details
    // save profile details in db
    console.log(profile);
    const uds: UserDataStore = new UserDataStore();
    const user: UserObject = await uds.findByGoogleID(profile.id);
    if (user === null)
    {
      // User doesn't exist, create a new one
      const user = new UserObject({
        email: profile.emails?.[0].value,
        googleID: profile.id,
      });
      
      await uds.add(user);
      return cb(null, user);
    }

    // Found existing user, return found user
    return cb(null, user);
}));


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
  console.log(user);
  process.nextTick(function () {
    cb(null, { id: user._id });
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
  res.redirect("http://127.0.0.1:3000");
};