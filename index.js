const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const routeDashboard = require('./routes/dashboard.js');
const session = require('express-session');
const app = express();


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejsMate);

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'dF9!h3J7kL2pQ5R8T0vW1X4Y6Z9aBcDeFg', // Replace with a strong secret
    resave: false,
    saveUninitialized: true
}));

app.use('/', routeDashboard);

const port = process.env.PORT || 8000;
app.listen(port, ()=>{
    console.log(`listening on http://localhost:${port}`);
})

app.use((err, req, res, next) => {
    console.error('Error stack:', err.stack);
    console.error('Error message:', err.message);
    res.status(500).send('Something broke!');
});