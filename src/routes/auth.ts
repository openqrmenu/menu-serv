import express from "express";
import passport from "passport";
import passportLocal from "passport-local";
import { isAuthenticated } from "../config/passport";
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { UserDataStore, UserObject } from "../models/user";

const router = express.Router();

/** POST /login/password
 *
 * This route authenticates the user by verifying a username and password.
 *
 * A username and password are submitted to this route via an HTML form, which
 * was rendered by the `GET /login` route.  The username and password is
 * authenticated using the `local` strategy.  The strategy will parse the
 * username and password from the request and call the `verify` function.
 *
 * Upon successful authentication, a login session will be established.  As the
 * user interacts with the app, by clicking links and submitting forms, the
 * subsequent requests will be authenticated by verifying the session.
 *
 * When authentication fails, the user will be re-prompted to login and shown
 * a message informing them of what went wrong.
 *
 * @openapi
 * /login/password:
 *   post:
 *     summary: Log in using a username and password
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: number
 *     responses:
 *       "302":
 *         description: Redirect.
 */

router.post("/login/password",  passport.authenticate("local"),
        function(req, res) {
          res.status(200).json(
            {
            "authenticated": true 
            }
          );
});

router.get("/checkauth", isAuthenticated, function(req, res){

    res.status(200).json({
        status: "Login successful!"
    });
});

router.get("/getstatus", function (req, res)
{
  const isAuth = req.isAuthenticated();
  res.status(200).json(
    {
    "authenticated": isAuth 
    }
  );
});

  
/* POST /logout
 *
 * This route logs the user out.
 */
router.post("/logout", function(req: Request, res: Response, next: NextFunction) {
  //req.logOut();
  req.session.destroy(function (err) {
    //res.clearCookie("connect.sid", {
      //path: "/", 

    //});
    res.status(200).clearCookie("connect.sid").json(
      {
        "authenticated": false
      }
    );
  });
  });

/* POST /signup
 *
 * This route creates a new user account.
 *
 * A desired username and password are submitted to this route via an HTML form,
 * which was rendered by the `GET /signup` route.  The password is hashed and
 * then a new user record is inserted into the database.  If the record is
 * successfully created, the user is logged in.
 */
router.post("/signup", async function (req, res, next) {
  const username = req.body.username;
  const password = req.body.password;
  const hashedpassword = bcrypt.hashSync(password, 10);

  const user = new UserObject({
    name: username,
    hash_password: hashedpassword,
  });
  const uds: UserDataStore = new UserDataStore();
  await uds.add(user);

  res.status(200).json({
    status: "ok",
  });
});

export default router;