const WebSocket = require('ws')
const express = require('express');
const {open} = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const { request } = require('http');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json())
app.use(cors());

const dbPath = path.join(__dirname, 'goodreads.db');

let db = null;
const mysql = require('mysql2');
const { time } = require('console');
var con = null
const initializeDbAndServer = async() => {
    try{
        db = mysql.createConnection({
        host: "localhost",
        user: "vaishu",
        password: "Bharu@96",
        database: "user_registration",
        insecureAuth : true
        });
        console.log(db)
        app.listen(3004 , () => {
            console.log('server running at loaclhost 3004')
        })
        db.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");
        })  
    } catch(e){
        console.log(`DB Error: ${e.message}`)
        process.exit(1)
    }
}

initializeDbAndServer();



// Registration API
app.post('/registration/', (request, response) => {
    const userDetails = request.body
    const {name, password, mobile, email} = userDetails
    
    let tableName = 'userInfo';

    let createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${tableName}(
        Id INTEGER NOT NULL AUTO_INCREMENT,
        Name VARCHAR (120),
        Password VARCHAR (120),
        Mobile VARCHAR (200),
        Email VARCHAR (120),
        PRIMARY KEY (Id)
        );`;

    db.query(createTableQuery, (err, result) => {
        if(err) 
            return response.status(500)

        if (userDetails.name !== '' && userDetails.password !== "" && userDetails.mobile !== "" && userDetails.email !== ""){
            const insertQuery = `
            INSERT INTO 
               userInfo (Name, Password, Mobile, Email)
            VALUES 
                (
                    "${name}", "${password}", "${mobile}", "${email}"
                );`;
        db.query(insertQuery, (err, result) => {
            if (err) {
                response.status(401).json(err)
                return
            }
                response.status(200).json("User Created Successfully")
                return
    
        });
        }else{
            response.status(500).json("Enter Valid User")
            return 
        }
        

    });
    
});



// Login API

app.post("/login/", (request, response) => {
    const userDetails = request.body
    const {mobile, password} = userDetails
    const selectUserQuery = `
        SELECT 
            *
        FROM
            userInfo
        WHERE
            Mobile = "${mobile}"
            AND Password = "${password}";
    `;
    db.query(selectUserQuery, (err, result) => {
        if (err){
            response.status(401)
            .json("User Not Found")
       
        }
        if (result&&result[0]&&result[0].Password === password && result[0].Mobile === mobile){
            const payload = {mobile: mobile}
            const jwtToken = jwt.sign(payload, "hsokelpanvmhudm")
            response.json({result, jwtToken});
            response.status(200);
            
        }
        
    })
})




//select table
app.get("/select/", (request, response) => {
    const selectUserQuery = `
        SELECT
            *
        FROM
            userInfo;
    `;
    db.query(selectUserQuery, (err, result) => {
        if(err){
            response.json("Cannot Select User")
        }
        response.status(200).json(result)
    });
});



//Post Insert Table
app.post("/insertPost/", (request, response) => {
    const postDetails = request.body
    const {personId, name, message} = postDetails

    const createPostTable = `
         CREATE TABLE IF NOT EXISTS postInfo(
            Id INTEGER NOT NULL AUTO_INCREMENT,
            PersonId INTEGER,
            Name VARCHAR (120),
            Message VARCHAR (120),
            Date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (Id),
            FOREIGN KEY (PersonId) REFERENCES userInfo(Id)
         );`;

         db.query(createPostTable, (err, result) => {
            if (err){
                response.status(500)
            }
                response.status(200)
            const postInsertTable = `
                INSERT INTO 
                    postInfo (PersonId, Name, Message)
                VALUES 
                    (
                        ${personId}, "${name}", "${message}"
                    );`;

                db.query(postInsertTable, (err, result) => {
                    if (err){
                        response.status(500).json(err)
                        return
                    }
                    response.status(200).json(result)
                    return
                    
                });
         });

});


// Delete Post API
app.delete("/deletePostCard", (request, response) => {
    const id = request.query.id;
    const deletePostCard = `
    DELETE FROM 
        postInfo
    WHERE 
        Id = ${id};`;

    db.query(deletePostCard, (err, result) => {
        if(err){
            response.status(500).json(err)
            return
        }
        response.status(200).json(result)
    })
})


// Edit Post API
app.put("/editPostCard", (request, response) => {
    const editDetails = request.body
    const {id, messageInput} = editDetails
    const editPostCard = `
        UPDATE
            postInfo
        SET 
            Message='${messageInput}',
            Date = CURRENT_TIMESTAMP
        WHERE
         Id = ${id};`;

        db.query(editPostCard, (err, result) => {
            if(err) {
                response.status(500).json(err)
                return
            }
            response.status(200).json(result)
        })
})


//Select Post Insert API
app.get("/selectPost/", (request, response) => {
    const selectInsertedPost = `
        SELECT 
           *
        From
            postInfo;
    `;

    db.query(selectInsertedPost, (err, result) => {
        if(err){
            response.status(500).json(err)
            return
        }
        response.status(200).json(result)
    });
})

// Select Login User Post
app.get("/my_post", (request, response) => {
    const personId = request.query.PersonId;
    const selectMyPostQuery = `
        SELECT
            * 
        FROM
            postInfo
        WHERE
            PersonId = ${personId}; `;

    db.query(selectMyPostQuery, (err, result) => {
        if(err){
            response.status(500).json(err)
            return
        }
        response.status(200).json(result)
    })
})



app.post("/insertUserChatDetails/", (request, response) => {
    const chatDetails = request.body 
    const {fromId, toId, messageInput} = chatDetails

    const createUserChatDetails = `
        CREATE TABLE IF NOT EXISTS userChatDetails(
             Id INTEGER NOT NULL AUTO_INCREMENT,
             FromId INTEGER,
             ToId INTEGER,
             Message VARCHAR(500),
             Date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
             PRIMARY KEY (Id),
             FOREIGN KEY (FromId) REFERENCES userInfo(Id),
             FOREIGN KEY (ToId) REFERENCES userInfo(Id)
        )`
        
        db.query(createUserChatDetails, (err, result) => {
            if(err){
                response.status(500).json(err);
                return
            }
            
            
            const insertUserChatDetails = `
                INSERT INTO
                    userChatDetails (FromId, ToId, Message)
                VALUES 
                        (${fromId}, ${toId}, '${messageInput}')
            `

            db.query(insertUserChatDetails, (err, result) => {
                if(err){
                    response.status(500).send(err)
                    return
                }
                response.status(200).send(result)
            })
        })
})


app.get("/selectChatDetails", (request, response) => {
    const FromId = request.query.FromId;
    const ToId = request.query.ToId

    const selectChatDetailsQuery = `
        SELECT 
            *
        FROM
            userChatDetails
            WHERE
            (FromId = ${FromId}  AND ToId = ${ToId})
            OR (FromId = ${ToId} AND ToId = ${FromId});
    `;

    
    db.query(selectChatDetailsQuery, (err, result) => {
        if(err){
            response.status(500).json(err)
            return
        }
        response.json(result)
        response.status(200)
    })
})


