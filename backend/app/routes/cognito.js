const { Router } = require('express');
const Cognito = require('../services/aws/cognito');
const generator = require('generate-password');
const BaseService = require('./../services/UserService');
const cognito = new Cognito();
const router = new Router();

router.get('/', function (req, res) {
    cognito.listUsers().then( (data)=>{
        const users = [];
        data.Users.forEach(user=>{
            user.Attributes.forEach(att=>
                {
                    user[att.Name] = att.Value;
                })
                users.push(user);
        })
        res.json(users);
    })
    .catch(error=>console.log('errr', error)); 
})

router.get('/:uname', function (req, res) {
    console.log('uname', req.params)
    cognito.getUser( { userName :req.params.uname } ).then( (data)=>{
        console.log('data', data);
            data.UserAttributes.forEach(att=>
            {
                data[att.Name] = att.Value;
            })
        res.json(data);
    })
    .catch(error=>
        {
            console.log('errr', error);
            return res.status(400).json(error);
        }); 
});

router.post('/', function (req, res) {

        const password = generator.generate({
            length: 10,
            numbers: true,
            uppercase: true,
            lowercase: true,
            symbols: true,
            strict: true
        });
        const params = {
                Username: req.body.Username ,
                email: req.body.email,
                name: req.body.name,
                phone_number : req.body.phone_number|| null
        };

        cognito.signup(params).then( (data)=>{
            console.log(data);
            res.json(data);
        })
        .catch(error=>{
            console.log('errr', error);
            return res.status(400).json(error);
        }); 
});

router.post('/cognito', function (req, res) {
  // Validate request
  console.log('req.body', req.body);
 
  const data = req.body;
  data.last_login = Date.now();

  BaseService.make().upsert(req.body)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
        console.log('eeor', err);
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the " + EntityType + "."
      });
    });
});

router.put('/:uname', function (req, res) {
    console.log('params', req.params);
    console.log('body', req.body);
    cognito.updateUser({username :req.params.uname, atts: req.body} ).then( (data)=>{
        console.log(data);
        res.json(data);
    })
    .catch(error=>{
        console.log('errr', error);
        return res.status(400).json(error);
    });
});

router.delete('/:uname', function (req, res) {
    console.log('delete');
    cognito.deleteUser({userName :req.params.uname} ).then( (data)=>{
        console.log(data);
        res.json(data);
    })
    .catch(error=>{
        console.log('errr', error);
        return res.status(400).json(error);
    });

});

module.exports = router;