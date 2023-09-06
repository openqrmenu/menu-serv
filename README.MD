Test Google Login : http://goqrmenu.com:3000/auth/login/google

# Google Login APIs
- https://console.cloud.google.com/
- Setup a local HOSTS file domain and setup that URL as redirect URI for google to invoke you back after login


# To Run the project in dev mode
on Windows, set the NODE_ENV to development
$env:NODE_ENV="development"
npm run watch

# Ubuntu 22.04 Setup Instructions
- Install a non-root user and setup node using nvm
- Install PM2 as the nodejs process manager
- Setup PM2 to start at reboot
Follow instructions at https://www.digitalocean.com/community/tutorials/how-to-use-pm2-to-setup-a-node-js-production-environment-on-an-ubuntu-vps
NVM install via Option 3 https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-22-04

# Run the project in production
npm run build
copy -R menu-ui/dist/* dist/public/app/
copy src/public/* dist/public

# Create a ENV folder with site.ca, site.crt, site.key files
copy -R env dist/

# Create a .env file in the dist folder
# change the port to 443
# set the google secret and other secrets as needed

NODE_ENV=production pm2 start dist/server.js