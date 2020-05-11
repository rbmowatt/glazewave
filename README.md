# Umanage

Umanage is a simple example project that allows a bakery to keep it's recipes in a CMS.
 - Umnanage Uses
	- node/express
		- for `backend api`
	- react/redux
		- for `frontend` 
	- dynamoDb
		- for storage and retrieval of `recipes`
	- Amazon Cognito
		- for authentication
		- for user management
	- Amazon s3
		- to store `recipe` images
		
It's current public example sits at https://zen-camino.com and is served using an EC2 instance sitting behind a load balancer sending all 443 traffic to port 80 and using nginx as a server for the frontend build and a proxy for the api.
## @todos and known issues
 - Clean Up how session is stored and retrieved
	 - refreshing page will keep you logged in but send you to home page because session doesn't finish loading before page render
- Enforce acl on backend
		 -  right now all crud permissions are handled in the display
		 -  you could still look at the return values in the network console
- Crumbtrails
- Responsiveness
	- it's not the worst ever but it's far from the best
- Secure Tokens in cookie!!!!
	- set encryption/decrypt middleware 
- Logging
## Setup
**NOTE :** All configuration variables are stored in the backend and frontends respective `.env/` files.
Copy `.env.tmp` to `.env` and edit accordingly 
### Services
- Create IAM user with full privileges to
	- Cognito
	- DynamoDb
	- S3
### GIT and NPM
- install `git`, `npm/node`
- clone
	- `git clone https://github.com/rbmowatt/umanage.git ./umanage`
-  frontend
	- `cd umanage/frontend && npm install`
- backend
	- `cd umanage/backendend && npm install`
### S3
- Create Bucket
- Make Bucket Public
### Cognito
- Create a new Amazon Cognito userpool
	- name it `youManage`
	- under attributes check
		- `name`
		- `email`
		- `phone_number`
	- Only allow administrators to create users
	- everything else can be left as default
- Create a client
	- name it `youManageApi`
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
 ### Dynamo DB
- Install dynamoDb locally
	- run on port `:8000`
	- The following command should start the db
		- `myiMac:dynamodb me $ java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb`
- Set up your config at `backend/.env`
- from the `backend` directory run `npm run scaffold`
	- This will create a schema named `recipes` and will populate it with 10 default records
### Starting the App
-  frontend
	- `cd umanage/frontend`
	- `npm run start`
- backend
	- `cd umanage/backend`
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
	- install jdk
		- `sudo amazon-linux-extras install java-openjdk11`
	- Install local instance of dynamo ( from `var/www` )
		- `sudo wget http://dynamodb-local.s3-website-us-west-2.amazonaws.com/dynamodb_local_latest.tar.gz`
		- `sudo tar -zxvf dynamodb_local_latest.tar.gz`
		-  `sudo rm -f dynamodb_local_latest.tar.gz`
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
		- `cd /data/var/www && sudo git clone https://github.com/rbmowatt/umanage .`
	- install front end packages
		- `cd frontend/ && sudo npm install`
	- install backend package
		- `cd ../backend && sudo npm install`
	- Add your true `.env` files
	- start nginx ( will serve react app from the `frontend/build` folder )
		- `sudo service nginx start`
	 - start dynamoDb
		 - `nohup java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb &`
	- start node
		- `sudo pm2 run start`
	