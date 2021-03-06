const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const MongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const fs = require('fs');
const { exec, execFile } = require('child_process');
const { stderr } = require('process');

let currentUser;

function genPassword(len) {
    var password = "";
    var symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_";
    for (var i = 0; i < len - 1; i++) {
        password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    }
    password += "U";
    return password;
}

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

        const db = mongoose.connection;

        /* Add users and olymps data */
        const quotesCollection = db.collection('quotes');
        const olympsCollection = db.collection('olymps');

        //app.use(bodyParser);

        app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
        app.use(bodyParser.json({ limit: '50mb' }));

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

        app.get("/getOlymps", (req, res) => {
            olympsCollection.find().toArray()
                .then(results => {
                    res.send(JSON.stringify(results));
                });
        });

        app.post("/createPDF", (req, res) => {
            let format = "." + req.headers.format;
            let rname = genPassword(15);
            let fname = rname + format;
            let path = "./Statements/" + fname;
            let arr = req.body;
            let len = Object.keys(arr).length;
            var arr2 = [];

            for (let i = 0; i < len; i++) {
                arr2.push(arr[i]);
            }
            var chunk = new Uint8Array(arr2);

            try {
                fs.appendFile(path, chunk, function (err) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        console.log("Temporary file created!");
                        res.send(fname);
                    }
                });
            }
            catch (err) {
                console.log(err.message);
            }
        });

        app.post("/deletePDF", (req, res) => {
            let fname = req.body;
            let path = "./Statements/" + fname.link;

            fs.unlink(path, (err) => {
                try {
                    if (err) throw err;

                    console.log('Temporary file deleted!');
                }
                catch (err) {
                    console.log(err.message);
                }
            });
        });

        io.on('connection', (socket) => {
            socket.on('quotes', newEl => {
                let user = JSON.parse(newEl);

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
                                    if (doc.nickname == "admin")
                                        io.emit("redirectToNewPage", "http://192.168.30.8:8080/AdminPage/adminpage.html");
                                    else
                                        io.emit("redirectToNewPage", "http://192.168.30.8:8080/Mainpage/mainpage.html");
                                }
                            });
                        }
                        catch (err) {
                            console.log(err.message);
                            io.emit('alertio', "Incorrect password or username!");
                        }
                    });
            });

            socket.on('saveuser', (newUser) => {
                currentUser = JSON.parse(newUser);
                quotesCollection.findOne({ nickname: currentUser },
                    function (err, doc) {
                        try {
                            if (err)
                                throw err;
                            console.log(doc);
                            console.log(doc.nickname);
                            io.emit('sendCurrentUser', doc);
                        }
                        catch (err) {
                            console.log(err.message);
                        }
                    });
            });

            socket.on('newOlymp', newOl => {
                let olymp = JSON.parse(newOl);

                olympsCollection.insertOne(olymp);
            });

            socket.on('olympreg', (user) => {
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
                                    io.emit('alertio', "Incorrect password!");
                                } else {
                                    console.log("Password matches!");
                                    io.emit('redirectToNewPage', "http://192.168.30.8:8080/Mainpage/mainpage.html");
                                }
                            });
                        }
                        catch (err) {
                            console.log(err.message);
                            io.emit('alertio', "Incorrect password!");
                        }
                    });
            });

            socket.on('addTeam', (olympName, newTeam, newTeamName) => {

                olympsCollection.findOne({ name: olympName },
                    function (err, doc) {
                        try {
                            if (err) {
                                throw err;
                            }
                            newTeam.teamName = newTeamName;
                            doc.allTeams.push(newTeam);

                            olympsCollection.save(doc);
                        }
                        catch (err) {
                            console.log(err.message);
                        }
                    });
            });
            socket.on('changeState', (olympName, newState) => {
                olympsCollection.updateOne({ name: olympName },
                    { $set: { state: newState } });
            });
            socket.on('changeRegisterState', (olympName, newRegisterState) => {
                olympsCollection.updateOne({ name: olympName },
                    { $set: { isRegisterOpen: newRegisterState } });
            });

            socket.on('sendsol', (allProblems, curProblem, compiler, text) => {
                //var problem = allProblems[curProblem];

                switch (compiler) {
                    case "clang":
                        fs.writeFileSync(__dirname + "\\myFile.c", text);
                        execFile("node", [__dirname + "\\Compilers\\ForC\\second_process.js"], (error, stdout, stderr) => {
                            if (error) {
                                console.log(error);
                                return;
                            }
                            stdout = stdout.slice(0, -1);
                            console.log(stdout);
                            io.emit('alertio', stdout);
                        });
                        break;
                    case "cpp":
                        fs.writeFileSync(__dirname + "\\myFile2.cpp", text);
                        execFile("node", [__dirname + "\\Compilers\\ForCpp\\second_process.js"], (error, stdout, stderr) => {
                            if (error) {
                                console.log(error);
                                return;
                            }
                            stdout = stdout.slice(0, -1);
                            console.log(stdout);
                        });
                        break;
                    case "python":

                        break;
                    case "js":
                        fs.writeFileSync(__dirname + "\\Compilers\\ForJs\\js_example.txt", text);
                        execFile("node", [__dirname + "\\Compilers\\ForJs\\second_process.js"], (error, stdout, stderr) => {
                            if (error) {
                                console.log(error);
                                return;
                            }
                            stdout = stdout.slice(0, -1);
                            console.log(stdout);
                        });
                        break;
                    default:
                        console.log("Undefined compiler!!!");
                }
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

