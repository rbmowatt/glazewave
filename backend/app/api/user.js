const { Router } = require('express');
const Cognito = require('../services/aws/cognito');
const generator = require('generate-password');
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
                Username: req.body.userName ,
                email: req.body.email,
                name: req.body.name,
                phone_number : req.body.phone_number|| null,
                password:  password
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