import express from "express";
import passport from "passport";
import { isAuthenticated } from "../config/passport";
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { UserDataStore, UserObject } from "../models/user";
import { Status } from "../models/status";
import jwt from "jsonwebtoken";
import logger from "../util/logger";
import { body, validationResult, ValidationError, Result } from "express-validator";
import { validationErrorMsg } from "../util/validation";

import { OTP_JWT_SECRET, APP_URL } from "../util/secrets";

const router = express.Router();

router.post("/login/password", 
    body("email").trim().escape().isEmail(), 
    body("password").trim().notEmpty(), function(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json(new Status(false, validationErrorMsg(result)));
  }

  passport.authenticate("local", function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.status(401).json(
      new Status(false,info.message)
      ); }

    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.status(200).json(
        new Status(true) );
    });
  })(req, res, next);
});

router.get("/login/google", passport.authenticate("google", {
  scope: ["email", "profile"],
}));

router.post("/login/token", body("token").isJWT(), function(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json(new Status(false, validationErrorMsg(result)));
  }

  const token = req.body.token;
  jwt.verify(token, OTP_JWT_SECRET, async function (err: any, decoded: any)
  {
    if (err)
    {
      logger.debug(err);
      return res.redirect(APP_URL);
    }

    const uds: UserDataStore = new UserDataStore();
    const user: UserObject = await uds.findById(decoded.data);
    if (user === null)
    {
      logger.debug("Cannot Find User ");  
      return res.redirect(APP_URL);
    }

    logger.debug("Found User for Login with Token:");
    logger.debug(user);  
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.status(200).json(
        new Status(true) );
    });
  
  });
});

router.get("/checkauth", isAuthenticated, function(req, res){
    res.status(200).json({
        status: "Login successful!"
    });
});

router.get("/redirect/google", function(req, res, next) {
  passport.authenticate("google", function(err, user, info) {
    if (err) { return next(err); }
    if (!user) {
      return res.redirect(APP_URL);
    }

    const payload =  { exp: Math.floor(Date.now() / 1000) + (60 * 60), data: user._id};
    
    // Generate JWT token
    const token = jwt.sign(
     payload, OTP_JWT_SECRET);

    res.redirect(APP_URL + "/#/oauthlogin?token=" + token);
  })(req, res, next);
});


router.get("/getstatus", function (req, res)
{
  const isAuth = req.isAuthenticated();
  res.status(200).json(
    new Status(isAuth) 
  );
});
  
router.post("/logout", function (req: Request, res: Response, next: NextFunction) {
    req.session.destroy(function (err) {
      res.status(200).clearCookie("connect.sid").json(new Status(false));
    });
});

router.post("/signup", 
body("email").trim().escape().isEmail(), 
body("password").trim().notEmpty(), 
async function (req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json(new Status(false, validationErrorMsg(result)));
  }

  const email = req.body.email;
  const password = req.body.password;
  const hashedpassword = bcrypt.hashSync(password, 10);
  const user = new UserObject({
    email: email,
    hash_password: hashedpassword,
  });
  
  const uds: UserDataStore = new UserDataStore();
  const existinguser: UserObject = await uds.findByEmail(email);
  if (existinguser === null)
  {
    await uds.add(user);

    return res.status(200).json(new Status(true,""));
  }

  return res.status(200).json(
    new Status(false,"Account creation failed, email already exists"));

});

export default router;