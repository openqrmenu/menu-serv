import cron from "node-cron";
import { UserDataStore } from "../models/user";
import { MenuCardDataStore } from "../models/menucard";
import { MenuItemDataStore } from "../models/menuitem";
import  mailer from "./mailer";
import logger from "./logger";
import { FROM_EMAIL, REPORT_EMAIL } from "./secrets";

export function scheduleCron(): void
{
    // ... Quick Email Report Every 8 PM
    cron.schedule("0 20 * * *", async () => {
        logger.debug("RUNNING CRON REPORT TASK");

        const uds:UserDataStore = new UserDataStore();
        const mcds:MenuCardDataStore = new MenuCardDataStore();
        const mids:MenuItemDataStore = new MenuItemDataStore();

        const userCount = await uds.count();
        const menuCount = await mcds.count();
        const menuItemCount = await mids.count();

        
        let text = "Daily Report for " + new Date().toLocaleDateString() + "\r\n";
        text += "User Count: " + userCount + "\r\n";   
        text += "Menus Count: " + menuCount + "\r\n";
        text += "Menu Items Count: " + menuItemCount + "\r\n";
        logger.debug("DAILY REPORT " + text);

        const mailOptions = {
            from: FROM_EMAIL,
            to: REPORT_EMAIL,
            subject: "[OPENQRMENU DAILY REPORT] Report for " + new Date().toLocaleDateString(),
            text: text
        };
      
        mailer.sendMail(mailOptions, function (error, info) {
          if (error) {
            logger.error(error);
          } else {
            logger.debug("Email sent: " + info.response);
          }
        });
      });
    
}
