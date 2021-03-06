# Glazewave

Glazewave is a project that will allow surfers to track and monitor their surfing and gain analtytics based on location, board and swell type.
 - Glazewave Uses
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
	- Elastic Search
		- For searching and aggregation
	- Google places and Stormglass for local wave forecasts
		
It's current dev example sits at https://mysurfsesh.com and is served using an EC2 instance sitting behind a load balancer sending all 443 traffic to port 80 and using nginx as a server for the frontend build and a proxy for the api.
## @todos and known issues
 - Clean Up how session is stored and retrieved
- Responsiveness/CSS
	- it's not the worst ever but it's far from the best
- Logging
- Backend Acl
## Frontend /UI
### Requests
- Most requests will be dispatched and handled through a single point `( ./frontend/src/middleware/api.js )` which will
	- Set a loading state in the api reducer
	- Perform request
	- dispatch action provided to appropriate reducer
	- remove loading state from api reducer
- Requests can be built easily and uniformly by extending `src/requests/BaseRequest.js` and setting the endpoint variable to the proper endpoint
	- Base request come with a number of methods for basic crud operations
	- More specific functionality can be placed within the class that inherits from Base
	- BaseRequest is set up in such a way as to parse and present parameters in a format the backend api expects. It should be used as often as possible.
		- `import  BaseRequest  from  './BaseRequest';`
		- `class  BoardRequests  extends  BaseRequest{`
		- `REQUEST_TYPE = 'BOARD';`
		- `constructor( session ){`
		- `super(session);`	
		- `this.endpoint = '/api/board';`
		- `}.....`
		- `export  default  BoardRequests;`
### Data and Search
- Although Elastic Search is implemented it is not being used as a full data store from which to receive complete objects.
	- Elastic Search is used only for search
	- When a search is performed it triggers a call to the backend api with the id's returned  from Elastic Search.
		- This is the hydrated data that will appear in the UI.
### Geolocation and Wave Data
- Gathering wave data is a three step process
	- Get geocordinates from google paces
	- Find the nearest beach stored by geolocation via Elastic Search
		- This data has been complied using Surfline
	- Ping Stormglass for the wave data based on the nearest beached geoloc
- The reason for the intermediate step is so that we are always looking at relevant data
	- Showing someone inland the local wave conditions base on their exact location would result in no bueno.
## Backend/API
### Architecure

As the API contains no views we will use what I will call an **MSC** Pattern.

In this pattern a **Controller** will never communicate directly with a **Model** but instead use an intermediary **Service** to store and retrieve data.

### Services
The **Service** is the power engine behind every **Request** and **Response**. It accepts communications from an input and works with the **Models** to retrieve the information to be passed back to the client method.

-  **Services Should...**
	* be used to perform actions and provide/store data.
	* map and expose additional **Scopes** to the client
	* Have a single **BaseModel** but be able to work with many other models
		 *  **BaseModel** represents the **Model** that a **Service** will perform its request upon unless told otherwise and allows us to implement inheritance from a **Base Service**
	* Optionally take a model and wrap it in a number of methods that can be combined with the parser middleware to create the required queries with ease.
* Any Service method is welcome to use any Model or Service to gather the information however we should try to minimize using Models to achieve things we could do with other Services.

	* **BaseService.js**
		* Holds an assortment of reusable methods to retrieve data from an associated **Model**  `<BaseModel>`
		*  *Ex.*
			* all
			* where/whereIn
			* find
			* create
			* update
			* delete

	* By extending **BaseService** and assigning a **Model** you are automatically creating an interface for a client to call a number of curated methods on said **Model** while avoiding creating dependencies between client and **Model**
		* `const  db = require("../models");`
		 `const  BaseModel = db.Board;`
		`const  BaseService = require('./BaseService');`
		`class  BoardService  extends  BaseService { constructor(){ super(BaseModel); }`
		`module.exports = BoardService;`
		
	*  *for example the database structure could change without affecting **Controllers** and other clients of the **Service** as long as the **Service** is adjusted to account for the change.*
### Controllers
- Should be stupid `only worry about knowing what services to ask for info`
- Should get all of their data and perform most actions via Services
- 	For the most part Controllers should have to  do little more than pass `req.parser` into the **Service** associated with the entity in question.
### Security 
- Handled through cognito
- On each load `middleware` will confirm identity of user and either reject or add user object to request
### Request
- Custom middleware will interpret request and organize into a number of object properties grouping them by type
	- `ex. wheres, limit, page,withs`
- The result of this middleware is added to the request with the property name of `parser`
	- `router.get('/', function (req, res) {BaseService.make().where(req.parser).then(data  => {...`
### Elastic Search
- Using Elastic Search for search requires us to keep the DB in sync with the Elastic Search Index
- This is accomplished by adding hooks to the Sequelize Models
	- After each CRUD operation the result will be sent to a queue that will batch insert into the appropriate Elastic Search index when the queue either fills or reaches a specified time limit.
	- That being said results may not be instantaneous!
- To sync or resync the already existing DB you can call command
	- `npm run sync-elastic` from ./backend


## Setup
**NOTE :** All configuration variables are stored in the backend and frontends respective `.env/` files.
Copy `.env.tmp` to `.env` and edit accordingly 
### Services
- Create IAM user with privileges to
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
		- `family_name`
		- `given_name`
		- `email`
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
		- edit `/etc/nginx/nginx.conf` server section to resemble [this](https://github.com/rbmowatt/surfbook/docs/nginx.example.txt)
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
	
