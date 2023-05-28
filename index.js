const express = require('express')
const sqlLib = require("./sqllib")
const app_config = require("./config")  // TODO: check how to limit the scope of importing config.js
const orderRouter = require("./router/order_router")
const itemsRouter = require("./router/items_router")

const app = express()

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.listen(app_config.app_port.port, ()=> {
    console.log("Server Listening in port," + app_config.app_port.port)
})

app.get("/", (req, res)=> {
    console.log("Get called")

    // sqlLib.querySql("Select * from stakeholders", (results)=> {
    //     res.json(results)
    // })

    var fields = req.query.fields
    // console.log(fields.split(","))
    // console.log(req.query.itemname)
    
})

app.post("/", (req, res)=> {
    console.log("Post called")
    //res.json("success")
    
})



app.use("/orders", orderRouter)

app.use("/items", itemsRouter)