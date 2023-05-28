const sql_config = require("./config")
const mysql = require("mysql2")
// TODO: convert sql requests to asyncronous

// const pool = mysql.createPool({
//     host: sql_config.host,
//     user: sql_config.user,
//     password: sql_config.password,
//     database: sql_config.database,
//     waitForConnections: true,
//     connectionLimit: 5,
//     maxIdle: 5
// })

const connection = mysql.createConnection({
    // host: 'localhost',
    // user: 'vmanicka',
    // password: '12345',
    // database: 'eswar_engineers'

    host: sql_config.db_config.db.host,
    user: sql_config.db_config.db.user,
    password: sql_config.db_config.db.password,
    database: sql_config.db_config.db.database,
    dateStrings: true

});

connection.connect(function(err) {
    if(err) console.log(err);
    else console.log("connected");
})

querySql = (query, callback) => {
    //console.log("query " + query)
    console.log("query " + query)
    connection.query(query, (err, results, fields)=>{
        console.log(err)
        console.log(results)
        callback(results)
        //return results
    })
}

queryEscapedSql = (sql, inserts, callback) => {
    //console.log("query " + query)
    console.log("sql " + sql)
    console.log("inserts " + inserts)
    query = mysql.format(sql, inserts)
    console.log("query " + query)
    connection.query(query, (err, results, fields)=>{
        console.log(err)
        console.log(results)
        callback(results)
        //return results
    })
}

querymultiValuesSql = (sql, inserts, callback) => {
    //console.log("query " + query)
    console.log("sql " + sql)
    console.log("inserts " + inserts)
    query = mysql.format(sql, inserts)
    console.log("query " + query)
    connection.query(query, (err, results, fields)=>{
        console.log(err.code)
        console.log(results)
        callback(err, results)
        //return results
    })
}

module.exports = {querySql, queryEscapedSql, querymultiValuesSql};