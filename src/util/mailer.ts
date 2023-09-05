import logger from "./logger";
import nodemailer from "nodemailer";
import { SMTP_SERVER, SMTP_PORT, SMTP_NAME, SMTP_PASSWORD } from "./secrets";


const mailer = nodemailer.createTransport({
    host: SMTP_SERVER,
    port: Number(SMTP_PORT),
    secure: false, // upgrade later with STARTTLS
    auth: {
      user: SMTP_NAME,
      pass: SMTP_PASSWORD,
    },
  });

export default mailer;