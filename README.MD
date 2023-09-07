# Open QR Menu

This project is part of the OpenQRMenu Service and is the nodejs web server built using typescript using MongoDB as the database.

OpenQRMenu is hosted at [Go QR Menu](https://goqrmenu.com)

Note that the UI for this service is the openqrmenu/menu-ui vuejs3 project.

## Development

During Development, the UI runs off http port 3000

Before starting, ensure MongoDB is setup and running off 127.0.0.1:27017

Setup Project Reqs
`npm install`

Rename the .env.example file to .env and update the values in there.

Start the service by
`$env:NODE_ENV="development"`
`npm run watch`

Then run the menu-ui project and open https://localhost:3000 to access the site.

### Production

During production, the service defaults to https and port 443.

To build the service 
`npm run build`

Create a ENV folder with site.ca, site.crt, site.key files needed for serving ssl
`copy -R env dist/`

Create and copy production .env file into dist
`copy .env dist/`

Use PM2 as process manager to startup the server
`NODE_ENV=production pm2 start dist/server.js`

### Additional Resources and Information
#### Google Login APIs
- Setup a new project and add credentials at https://console.cloud.google.com/
- Development Tip: Setup a local HOSTS file domain and setup that URL as redirect URI for google to invoke you back after login

#### Ubuntu 22.04 Server Setup Instructions
- Install a non-root user and setup node using nvm
- Install PM2 as the nodejs process manager
- Setup PM2 to start at reboot
Follow instructions at https://www.digitalocean.com/community/tutorials/how-to-use-pm2-to-setup-a-node-js-production-environment-on-an-ubuntu-vps
NVM install via Option 3 https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-22-04
- Install MongoDB and setup service to start on reboot


