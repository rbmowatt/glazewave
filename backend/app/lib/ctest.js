const Cognito = require('./cognitoAdd');
cognito = new Cognito();
console.log('params' , cognito.params)
//cognito.signup({name : 'bobtashoka323y', password : 'zbxcEry834#', phone : '+16098765678', email : 'richmowatt+test1@gmail.com'});
cognito.listUsers();