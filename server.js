const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const MongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");

let currentUser;

function CreateHashPassword(my_password, saltRounds) {
    var hashed_password = "";

    bcrypt.genSalt(saltRounds, function (err, salt) {
        if (err) {
            throw err;
        }
        else {
            hashed_password = bcrypt.hash(my_password, salt, function (err, hash) {
                if (err) {
                    throw err;
                }
                else {
                    console.log(hash);
                    return hashed_password;
                }
            })
        }
    })
}

async function CreateHashPassword2(password, saltRounds) {
    const salt = await bcrypt.genSalt(saltRounds);
    const hashed = await bcrypt.hash(password, salt);
    return hashed;
}

mongoose.connect('mongodb+srv://olymppml30:AU3ID3MM5VB5@cluster0.cdj7z.mongodb.net/DataBase?retryWrites=true&w=majority', {
    useUnifiedTopology: true,
    useNewUrlParser: true
})
    .then(client => {
        console.log('Connected to Database');
        mongoose.Promise = global.Promise;

        //const db = client.db('DataBase');
        const db = mongoose.connection;
        /*
        db.once('DataBase', function callback() {
            console.log("h");
        }); 
        */

        //const db = mongoose.db('DataBase');

        const quotesCollection = db.collection('quotes');

        //app.use(express.json());

        app.use(bodyParser.urlencoded({ extended: true }));

        app.use(express.static(__dirname + '/'));

        app.get('/user_module/user_hash_password.js', (req, res) => {
            res.sendFile(__dirname + '/user_module/user_hash_password.js');
        });

        app.get("/getDB", (req, res) => {
            quotesCollection.find().toArray()
                .then(results => {
                    res.send(JSON.stringify(results));
                });
        });

        io.on('connection', (socket) => {
            socket.on('quotes', newEl => {
                let user = JSON.parse(newEl);
                /*
                    user.password = CreateHashPassword(user.password, 8);
                */
                bcrypt.genSalt(10, function (saltError, salt) {
                    try {
                        if (saltError) {
                            throw saltError;
                        } else {
                            bcrypt.hash(user.password, salt, function (hashError, hash) {
                                if (hashError) {
                                    throw hashError;
                                }
                                user.password = hash;
                                quotesCollection.insertOne(user);
                            });
                        }
                    }
                    catch (err) {
                        console.log(err.message);
                    }
                });
            });
            socket.on('password', (user) => {
                var array_of_strings = user.split(":");
                let username_by_user = array_of_strings[0];
                console.log(username_by_user);
                let passwordEnteredByUser = array_of_strings[1];
                console.log(passwordEnteredByUser);
                quotesCollection.findOne({ nickname: username_by_user },
                    function (err, doc) {
                        try {
                            if (err)
                                throw err;
                            console.log(doc);
                            console.log(doc.nickname);
                            let hashed_password = doc.password;
                            bcrypt.compare(passwordEnteredByUser, hashed_password, function (error, isMatch) {
                                if (error) {
                                    throw error
                                } else if (!isMatch) {
                                    console.log("Password doesn't match!")
                                    io.emit('alertio', "Incorrect password or username!");
                                } else {
                                    console.log("Password matches!")
                                    io.emit("redirectToNewPage", "http://localhost:8080/Mainpage/mainpage.html");
                                }
                            });
                        }
                        catch (err) {
                            console.log(err.message);
                            io.emit('alertio', "Incorrect password or username!" + username_by_user);
                        }
                    });
            });

            socket.on('saveuser', (newUser) => {
                currentUser = JSON.parse(newUser);
                //quotesCollection.findOne({ nickname: currentUser },
            });
        });

        http.listen(8080);
    })
    .catch(console.error)

/*
mongoose.connection.on("error", err => {
    console.log("err", err)
})
mongoose.connection.on("connected", (err, res) => {
    console.log('Connected to Database');
    mongoose.Promise = global.Promise;

    //const db = client.db('DataBase');
    const db = mongoose.connection;
    //const db = mongoose.db('DataBase');

    const quotesCollection = db.collection('quotes');

    app.use(express.json());

    app.use(bodyParser.urlencoded({ extended: true }));

    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/index.html');
    });

    app.get('/styles.css', (req, res) => {
        res.sendFile(__dirname + '/styles.css');
    });

    app.get('/signup/styles.css', (req, res) => {
        res.sendFile(__dirname + '/signup/styles.css');
    });

    app.get('/src/pml30.jpg', (req, res) => {
        res.sendFile(__dirname + '/src/pml30.jpg');
    });

    app.get('/signup/signup.html', (req, res) => {
        res.sendFile(__dirname + '/signup/signup.html');
    });

    app.get('/getDB', (req, res) => {
        db.collection('quotes').find().toArray()
            .then(results => {
                console.log(results);
                res.send(JSON.stringify(results));
            })
    });

    io.on('connection', (socket) => {
        socket.on('quotes', newEl => {
            let user = JSON.parse(newEl);
            quotesCollection.insertOne(user);
        });
    });

    http.listen(8080);

})
*/

