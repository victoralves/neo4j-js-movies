var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver').v1;

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Driver
var driver = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "neo4j"));

// Session
var session = driver.session();



// Go Home route
app.get('/', function (req, res) {
    session
        .run("MATCH (n:Person) RETURN n LIMIT 10")
        .then(function (result) {
            var personArr = [];
            result.records.forEach(function (record) {
                // console.log(record._fields.);
                personArr.push({
                    id: record._fields[0].identity.low,
                    name: record._fields[0].properties.name
                });
            });

            session
                .run("MATCH (n:Movie) RETURN n LIMIT 10")
                .then(function (resultMovie) {
                    var movieArr = [];
                    resultMovie.records.forEach(function (record) {
                        movieArr.push(record._fields[0].properties)
                    });
                    res.render('index', {
                        persons: personArr,
                        movies: movieArr
                    });
                })

        })
        .catch(function (error) {
            console.log(error);
        })

});

// Add Person in route
app.post('/person/add', function(req, res){
    var name = req.body.name;
    // console.log('Cad Ator Nome::', name);

    session
        .run("CREATE (n:Person {name:{nameParam}}) RETURN n.name", {nameParam: name})
        .then(function(result){
            res.redirect('/');
            session.close();
        })
        .catch(function(error){
            console.log('Erro CREATE Person',error);
        })
});

// Add Movie in route
app.post('/movie/add', function (req, res) {
    var title = req.body.title;
    var tagline = req.body.tagline;
    var released = req.body.released;

    session
        .run("CREATE (n:Movie {title:{titleParam}, tagline:{taglineParam}, released:{releasedParam}}) RETURN n", { titleParam: title, taglineParam: tagline, releasedParam: released  })
        .then(function (result) {
            res.redirect('/');
            session.close();
        })
        .catch(function (error) {
            console.log('Erro CREATE Person', error);
        })
});

// Connect Actor in Movie Route
app.post('/actor-movie/connect', function (req, res) {
    var actor = req.body.actor;
    var movie = req.body.movie;

    session
        .run("MATCH(a:Person {name: {actorParam}}),(b:Movie {title: {movieParam}}) MERGE (a)-[r:ACTED_IN]->(b) RETURN a, b", { actorParam: actor, movieParam: movie })
        .then(function (result) {
            res.redirect('/');
            session.close();
        })
        .catch(function (error) {
            console.log('Erro CREATE Person', error);
        })
});



app.listen(3000);

console.log('Server started on port 3000');

module.exports = app;