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
import  mailer from "../util/mailer";

import { FROM_EMAIL, OTP_JWT_SECRET, APP_URL } from "../util/secrets";

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

router.post("/initresetpassword", 
body("email").trim().notEmpty().isEmail(), 
async function (req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json(new Status(false, validationErrorMsg(result)));
  }

  const email = req.body.email;
  const uds: UserDataStore = new UserDataStore();
  const existinguser: UserObject = await uds.findByEmail(email);
  if (existinguser === null || existinguser.hash_password === "")
  {
    return res.status(200).json(new Status(true,"If account exists, further instructions have been emailed. Make sure to check your spam folder."));
  }

  // Generate JWT token
  const payload =  { exp: Math.floor(Date.now() / 1000) + (10 * 60 * 60), data: existinguser._id, operation: "resetpw"};
  const token = jwt.sign(payload, OTP_JWT_SECRET);

  console.log("JWT for Reset is " + token);
  
  const text = "You or someone requested a password reset at Open QR Menu. Please copy the following link to your browser to reset."
  + "If you didn't request this password request, you can safely ignore this message."
  + "\r\n\r\n"
  + APP_URL + "/app#/util/resetpw?token=" + token;

  console.log(text);
  const mailOptions = {
    from: FROM_EMAIL,
    to: existinguser.email,
    subject: "OPENQRMENU Password Reset Request",
    text: text
  };

 mailer.sendMail(mailOptions, function (error, info) {
    if (error) {
      logger.error(error);
      return res.status(200).json(new Status(true,"Error sending forgot password email"));
    } else {
      logger.debug("Email sent: " + info.response);
      return res.status(200).json(new Status(true,"If account exists, further instructions have been emailed. Make sure to check your spam folder."));
    }
 });
//  return res.status(200).json(new Status(true,"If account exists, further instructions have been emailed. Make sure to check your spam folder."));
});


router.post("/resetpassword", 
body("token").trim().escape().isJWT(),
body("password").trim().notEmpty(), 
async function (req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json(new Status(false, validationErrorMsg(result)));
  }

  const token = req.body.token;
  const password = req.body.password;
  const hashedpassword = bcrypt.hashSync(password, 10);
  
  jwt.verify(token, OTP_JWT_SECRET, async function (err: any, decoded: any)
  {
    if (err)
    {
      logger.error(err);
      return res.status(400).json(new Status(true,"Failed to reset password, Bad Request"));
    }
    if (decoded.operation != "resetpw")
    {
      logger.error("Bad JWT Operation for reset " + decoded.operation);
      return res.status(400).json(new Status(true,"Failed to reset password, Bad Request"));
    }


    const uds: UserDataStore = new UserDataStore();
    const user: UserObject = await uds.findById(decoded.data);
    if (user === null)
    {
      logger.debug("Cannot Find User ");  
      return res.status(400).json(new Status(true,"Failed to reset password, Bad Request"));
    }

    logger.debug("Found User for Login.. Updating Password!");
    user.hash_password = hashedpassword;
    await uds.update(user);
    return res.status(200).json(new Status(true) );
  });

  /*
  const uds: UserDataStore = new UserDataStore();
  const existinguser: UserObject = await uds.findByEmail(email);
  if (existinguser === null)
  {
    await uds.add(user);

    return res.status(200).json(new Status(true,""));
  }
*/
 

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