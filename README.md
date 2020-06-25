# MySurfSesh

MySurfSesh is a project that will allow surfers to track and monitor their surfing and gain analtytics based on location, board and swell type.
 - MySurfSesh Uses
	- node/express
		- for `api`
	- react/redux
		- for `ui` 
	- MySql with Sequelize
		- for storage and retrieval of data
	- Amazon Cognito
		- for authentication
		- for user management
	- Amazon s3
		- to store  images
	- Algolia
		- For searching and aggregation
	- Google places and Stormglass for local wave forecasts
		
It's current public example sits at https://mysurfsesh.com and is served using an EC2 instance sitting behind a load balancer sending all 443 traffic to port 80 and using nginx as a server for the frontend build and a proxy for the api.
## @todos and known issues
 - Clean Up how session is stored and retrieved
- Responsiveness
	- it's not the worst ever but it's far from the best
- Logging
## Frontend /UI
### Requests
- Nearly all requests will be dispatched and handled through a single method `( ./frontend/src/middleware/api.js )` that will
	- Set a loading state in the api reducer
	- Perform request
	- dispatch action provided to appropriate reducer
	- remove loading state from api reducer
- Requests can be built easily and uniformly by extending `src/requests/BaseRequest.js` and setting the endpoint variable to the proper endpoint
	- Base request come with a number of methods for basic crud operations
	- More specific functionality can be placed within the class that inherits from Base
	- BaseRequest is set up in such a way as to parse and present parameters in a format the backend api expects. It should be used as often as possible.
### Data and Search
- Although Algolia is implemented it is not being used as a full data store from which to receive complete objects.
	- Algolia is used only for search
	- When a search is performed it triggers a call to the backend api with the id's returned  from Algolia.
		- This is the hydrated data that will appear in the UI.
### Geolocation and Wave Data
- Gathering wave data is a three step process
	- Get geocordinates from google paces
	- Find the nearest beach stored by geolocation via Algolia
		- This data has been complied using Surfline
	- Ping Stormglass for the wave data based on the nearest beached geoloc
- The reason for the intermediate step is so that we are always looking at relevant data
	- Showing someone inland the local wave conditions base on their exact location would result in no bueno.
## Backend/API
### Security 
- Handled through cognito
- On each load `middleware` will confirm identity of user and either reject or add user object to request
### Request
- Custom middleware will interpret request and organize into a number of object properties grouping them by type
	- `ex. wheres, limit, page,withs`
- The result of this middleware is added to the request with the property name of `parser`
### Controllers
- For the most part Controllers should be stupid
- Controllers should get all of it's data and perform most actions via Services
### Services
- Services should be used to perform actions and provide/store data.
- Services that revolve around Database Entities and use Sequelize can be created easily by extending the app/services/BaseService object.
- The BaseService object takes a Sequelize model and wraps it in a number of methods that can be combined with the parser middleware to create the required queries with ease.
- For the most part Controllers should have to  do little more than pass `req.parser` into the service associated with the entity in question.
### Algolia
- Using Algolia for search requires us to keep the DB in sync with the Algolia Index
- This is accomplished by adding hooks to the Sequelize Models
	- After each CRUD operation the result will be sent to a queue that will batch insert into the appropriate Algolia index when the queue either fills or reaches a specified time limit.
	- That being said results may not be instantaneous!
- To sync or resync the already existing DB you can call command
	- `npm run sync-agolia` from ./backend
## Setup
**NOTE :** All configuration variables are stored in the backend and frontends respective `.env/` files.
Copy `.env.tmp` to `.env` and edit accordingly 
### Services
- Create IAM user with full privileges to
	- Cognito
	- S3
### GIT and NPM
- install `git`, `npm/node`
- clone
	- `git clone https://github.com/rbmowatt/mysurfsesh.git ./mysurfsesh`
-  frontend
	- `cd mysurfsesh/frontend && npm install`
- backend
	- `cd mysurfsesh/backendend && npm install`
### S3
- Create Bucket
- Make Bucket Public
### Cognito
- Create a new Amazon Cognito userpool
	- under attributes check
		- `name`
		- `email`
		- `phone_number`
	- Only allow administrators to create users
	- everything else can be left as default
- Create a client
	- make sure `Generate client secret` is not checked
	- leave everything else as default
- Configure Client
	- Select `Cognito User Pool` checkbox
	- signin url
		- `http://localhost:3000/login`
	- signout url 
		- `http://localhost:3000/logout`
	- Allowed oUath flows
		- `Authorization code grant`
		- `Implicit Grant`
	- Allowed OAuth Scopes
		-  select all
- Create a User for yourself
- Create a group named `Admins` and add yourself

### Starting the App
-  frontend
	- `cd mysurfsesh/frontend`
	- `npm run start`
- backend
	- `cd mysurfsesh/backend`
	- `npm run start`
## Releasing on AWS
- Create domain name
- use Certificate Manager to add https
	- [Get ssl cert](https://medium.com/@victor.leong.17/cheap-wildcard-ssl-certificate-with-aws-route-53-and-certificate-manager-ac922a4af5af)
- Create LoadBalancer 
	- Attach certificate to domain name
	- Domain MUST run on `https:://` to use `Cognito` 
	- add `listener` to `443` that forwards to `80` using certificate created above
	- open to `80` and `443`
- Create New Amazon Linux Instance and mount volume
	- `sudo mkdir /data`
	- `sudo mount /dev/xvdf /data`
	- create application directory
		- `sudo mkdir /data/var/www`
	- update
		- `sudo yum update`
	- install nginx
		- `sudo amazon-linux-extras install nginx1`
		- edit `/etc/nginx/nginx.conf` server section to resemble [this](https://github.com/rbmowatt/umanage/docs/nginx.example.txt)
	- install node
		- `curl -sL https://rpm.nodesource.com/setup_10.x | sudo bash -`
		- `sudo yum install -y nodejs`
	- install pm2 ( allows us to keep node running )
		- `npm install pm2 -g`
	- install git
		- `sudo yum install git`
	- install nodemon
		- `sudo npm install -g nodemon`
	- clone repo
		- `cd /data/var/www && sudo git clone https://github.com/rbmowatt/mysurfsesh .`
	- install front end packages
		- `cd frontend/ && sudo npm install`
	- install backend package
		- `cd ../backend && sudo npm install`
	- Add your true `.env` files
	- start nginx ( will serve react app from the `frontend/build` folder )
		- `sudo service nginx start`
	- start node
		- `sudo pm2 run start`
	