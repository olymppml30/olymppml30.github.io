const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb+srv://olymppml30:AU3ID3MM5VB5@cluster0.cdj7z.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {
    useUnifiedTopology:
        true
})
    .then(client => {
        console.log('Connected to Database');
        const db = client.db('DataBase');
        const quotesCollection = db.collection('quotes');

        app.use(bodyParser.urlencoded({ extended: true }));

        app.get('/', (req, res) => {
            res.sendFile(__dirname + '/index.html');
        });

        app.get('/styles.css', (req, res) => {
            res.sendFile(__dirname + '/styles.css');
        });

        app.get('/src/pml30.jpg', (req, res) => {
            res.sendFile(__dirname + '/src/pml30.jpg');
        });

        app.get('/getDB', (req, res) => {
            db.collection('quotes').find().toArray()
                .then(results => {
                    console.log(results)
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
    .catch(console.error)
