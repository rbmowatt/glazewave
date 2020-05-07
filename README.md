# Umanage

Umanage is a simple example project that allows a bakery to keep it's recipes in a CMS.
- Umnanage Uses
	- node
	- react
	- redux
	- dynamoDb
	- Amazon Cognito
## Setup
### Repository
- clone
	- `git clone git@github.com:rbmowatt/umanage.git ./umanage`
-  frontend
	- `cd umanage/frontend && npm install`
	- `yarn start`
- backend
	- `cd umanage/backendend && npm install`
	- `npm run start`
### Database
- Install dynamoDb locally
	- run on port `:8000`
	- The following command should start the db
		- `myiMac:dynamodb me $ java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb`
- Set up your config at `backend/app/config/dynamo.js`
- from the `backend` directory run `npm run scaffold`
	- This will create a schema named `recipes` and will populate it with 10 default records
### Authentication
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
- Set up your config at `backend/app/config/cognito.js`
- Set up your config at `frontend/src/config/cognito.js`