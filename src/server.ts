import errorHandler from "errorhandler";
import app from "./app";

import https from "https";
import fs from "fs";
import path from "path";

/**
 * Error Handler. Provides full stack
 */
if (process.env.NODE_ENV === "development") {
    app.use(errorHandler());


    const server = app.listen(app.get("port"), () => {
        console.log(
            "  App is running at http://localhost:%d in %s mode",
            app.get("port"),
            app.get("env")
        );
        console.log("  Press CTRL-C to stop\n");
    });
    
    
}
else
{
    console.log("Setting up SSL server");
    const httpsOptions = {
        cert: fs.readFileSync(path.join(__dirname, "env") + "/site.crt"),
        ca: fs.readFileSync(path.join(__dirname, "env") + "/site.ca"),
        key: fs.readFileSync(path.join(__dirname, "env") + "/site.key")
    };

    const server = https.createServer(httpsOptions, app);

    /**
     * Start Express server.
     */
    server.listen(app.get("port"), () => {
        console.log(
            "  App is running at https://localhost:%d in %s mode",
            app.get("port"),
            app.get("env")
        );
        console.log("  Press CTRL-C to stop\n");
    });
}
//export default server;
