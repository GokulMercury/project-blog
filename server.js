const express = require('express');
const app = express();
const session = require('express-session');


const home = require('./routes/api/home.js');
const auth = require('./routes/api/auth.js');
const article = require('./routes/api/article.js')
const user = require('./routes/api/user.js')

const bodyParser = require('body-parser');


app.use(session({secret : "Big secret", resave: true, saveUninitialized: true}));

app.use (bodyParser.urlencoded({extended: false}));

// MIDDLEWARE TO CONTROL CACHE
app.use((req, res, next)=> {
    if(!req.user) {
        res.header('Cache-control', 'private, no-cache, no-store, must-revalidate');         
        res.header('Expires', '-1');         
        res.header('Pragma', 'no-cache')     
    }     
    next(); 
})

app.use(express.static('public'));
app.set('view engine', 'pug');

app.use('/', home);
app.use('/auth', auth);
app.use('/article', article);
app.use('/user', user);


app.listen(8080, (err)=>{
    if (err) throw err;
    console.log('Server started smoothly')
});