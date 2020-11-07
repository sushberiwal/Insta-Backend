// npm install mysql
const mysql = require("mysql");

const secrets = require("./secrets.json");

const connection  = mysql.createPool({
  connectionLimit : 10,
  host     : secrets.host,
  user     : secrets.user,
  password : secrets.password,
  database : secrets.database
});


// connection.connect();
 


module.exports = connection;

