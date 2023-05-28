const sqlLib = require("../sqllib")
const constants = require("../app_constants")

exports.items_list = (req, res) => {
    console.log("items_list");
    query = "select * from items inner join po_items on items.id = po_items.item_id";

    sqlLib.querySql(query, (results) => {
        res.json(results)
    })
}

exports.item_name_material_detail = (req, res) => {
    console.log("item_material_detail");
    query = "select * from items inner join materials on items.material_id = materials.id where items.item_name=\"" 
            + req.query.item_name+"\"";

    sqlLib.querySql(query, (results) => {
        res.json(results)
    })
}

exports.item_name_po_list = (req, res) => {     // GET po's for given item_name
    console.log("item_name_po_list ", req.query.item_name);
    query = "select po_num, po_date, item_name, rate, total_qty, despatched_qty from items \
            inner join po_items on items.id = po_items.item_id \
            inner join purchase_orders on po_items.po_id = purchase_orders.id where item_name = ?"
    inserts = [req.query.item_name];

    query1 = "select po_num, po_date, item_name, rate, total_qty, despatched_qty from items \
    inner join po_items on items.id = po_items.item_id \
    inner join purchase_orders on po_items.po_id = purchase_orders.id where item_name = \"" + req.query.item_name + "\""

    sqlLib.querySql(query1, (results) => {
        res.json(results)
    })

    sqlLib.queryEscapedSql(query, inserts, (results) => {
        res.json(results)
    })
}