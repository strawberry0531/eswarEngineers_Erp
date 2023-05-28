const sqlLib = require("../sqllib")
const constants = require("../app_constants");
const { json } = require("express");

exports.order_list = (req, res) => {    // List of ALL PO's - Can be filtered using two dates
    console.log("order_list", req.query.from_po_date, req.query.to_po_date);
    var filterString = ""
    var inserts = [constants.PURCHASE_ORDER_TABLE, constants.STAKEHOLDER_TABLE]
    if (req.query.from_po_date != undefined) {
        filterString += " where po_date "
        if (req.query.to_po_date != undefined && req.query.to_po_date > req.query.from_po_date) {
            filterString += "between ? and ?"
            inserts.push(req.query.from_po_date)
            inserts.push(req.query.to_po_date)
        }
        else {
            filterString += "> ?"
            inserts.push(req.query.from_po_date)
        }
    }
    query = "select po_num, po_date, delivery_date, name as customer_name \
                 from ?? inner join ?? on customer_id = stakeholders.id " + filterString;

    sqlLib.queryEscapedSql(query, inserts, (results) => {
        res.json(results)
    })
}

exports.item_name_po_list = (req, res) => {     // GET po's for given item_name
    console.log("po_list_item_name ", req.query.item_name);
    if (req.query.item_name != undefined) {
        query = "select po_num, po_date, item_name, rate, total_qty, despatched_qty from items \
        inner join po_items on items.id = po_items.item_id \
        inner join purchase_orders on po_items.po_id = purchase_orders.id where item_name like ? order by po_num"
        inserts = [req.query.item_name];

        sqlLib.queryEscapedSql(query, inserts, (results) => {
            var viewData = { "purchase_orders": {} }
            results.forEach(element => {
                var poNum = element.po_num;
                if (!viewData.purchase_orders.hasOwnProperty(poNum)) {
                    viewData.purchase_orders[poNum] = []
                }

                var jsonData = {}
                jsonData["item_name"] = element.item_name
                jsonData["rate"] = element.rate
                jsonData["total_qty"] = element.total_qty
                jsonData["despatched_qty"] = element.despatched_qty
                console.log("json data:", jsonData)
                viewData.purchase_orders[poNum].push(jsonData)

            });
            console.log("view data:", viewData)

            res.json(viewData)
        })
    }
    else {
        res.send("invalid query param")
    }
}

exports.create_dc = (req, res) => {     // Create new DC
    console.log("create_dc ", req.body);
    dc_values = req.body
    var dc_id = 0

    // step1: add delivery challan table
    query = "insert into delivery_challans (po_id, customer_id, test_report_id, receiver_type, dc_date, remarks) values \
                ((select id from purchase_orders where po_num = ?), (select id from stakeholders where name = ?), \
                ?, ?, ?, ?)"
    inserts = [dc_values.po_num, dc_values.customer_name, dc_values.test_report_id, dc_values.receiver_type, dc_values.dc_date, dc_values.remarks]
    sqlLib.queryEscapedSql(query, inserts, (results) => {
        console.log("insert id ", results.insertId)
        console.log("affected rows ", results.affectedRows)
        dc_id = results.insertId

        // step2: add items to dc_item table
        query = "insert into dc_items (dc_id, po_item_id, qty) values ?"
        var values = []
        for (var key in dc_values["items"]) {
            values.push([dc_id, dc_values["items"][key].po_item_id, dc_values["items"][key].dc_qty])
            console.log("po_item_id ", dc_values["items"][key].po_item_id)
            console.log("qty ", dc_values["items"][key].dc_qty)
        }
        console.log(values)
        sqlLib.querymultiValuesSql(query, [values], (results) => {
            console.log("step2: affected rows ", results.affectedRows)
            //dc_id = results.insertId


            // step3: update despatched qty to po_items table
            values = []
            query = "update po_items set despatched_qty = case id "
            var items = []
            for (var key in dc_values["items"]) {
                query += "when ? then ? "
                values.push(dc_values["items"][key].po_item_id, dc_values["items"][key].total_despatched_qty)
                items.push(dc_values["items"][key].po_item_id)
            }
            query += " end where id in (" + items + ")"
            sqlLib.queryEscapedSql(query, values, (results) => {
                console.log("step3: affected rows ", results.affectedRows)
                res.json({ "dc_num": dc_id })
            })
        })
    })  
}

exports.create_credit_note = (req, res) => {     // Create new credit note
    console.log("create_credit_note ", req.body);
    credit_note_values = req.body
    var credit_note_id = 0

    // step1: add to creidt Notes table
    query = "insert into credit_notes (dc_id, date, total_rate, total_cgst, total_sgst, total_igst, total_amount) values \
                (?, ?, ?, ?, ?, ?, ?)"
    inserts = [credit_note_values.dc_id, credit_note_values.credit_note_date, credit_note_values.total_rate, credit_note_values.total_cgst, 
                credit_note_values.total_sgst, credit_note_values.total_igst, credit_note_values.total_amount]
    sqlLib.queryEscapedSql(query, inserts, (results) => {
        console.log("insert id ", results.insertId)
        console.log("affected rows ", results.affectedRows)
        credit_note_id = results.insertId

        // step2: add items to rejected items table
        query = "insert into rejected_items (credit_note_id, po_item_id, qty, rate, cgst, sgst, igst, amount) values ?"
        var values = []
        for (var key in credit_note_values["items"]) {
            values.push([credit_note_id, credit_note_values["items"][key].po_item_id, credit_note_values["items"][key].rejected_qty,
                            credit_note_values["items"][key].rate, credit_note_values["items"][key].cgst, credit_note_values["items"][key].sgst,
                            credit_note_values["items"][key].igst, credit_note_values["items"][key].amount])
        }
        console.log(values)
        sqlLib.querymultiValuesSql(query, [values], (results) => {
            console.log("step2: affected rows ", results.affectedRows)
            //dc_id = results.insertId


            // step3: update despatched qty to po_items table
            values = []
            query = "update po_items set despatched_qty = case id "
            var items = []
            for (var key in credit_note_values["items"]) {
                query += "when ? then ? "
                values.push(credit_note_values["items"][key].po_item_id, credit_note_values["items"][key].total_despatched_qty)
                items.push(credit_note_values["items"][key].po_item_id)
            }
            query += " end where id in (" + items + ")"
            sqlLib.queryEscapedSql(query, values, (results) => {
                console.log("step3: affected rows ", results.affectedRows)
                res.json({ "credit_note_id": credit_note_id })
            })
        })
    })  
}

exports.create_invoice = (req, res) => {     // Create new Invoice
    console.log("create_invoice ", req.body);
    inv_values = req.body
    var inv_id = 0

    // step1: add to invoices table
    query = "insert into invoices (po_id, invoice_date, total_price, total_cgst, total_sgst, total_igst, total_amount) values \
                ((select id from purchase_orders where po_num = ?), ?, ?, ?, ?, ?, ?)"
    inserts = [inv_values.po_num, inv_values.invoice_date, inv_values.total_rate, inv_values.total_cgst, 
                    inv_values.total_sgst, inv_values.total_igst, inv_values.total_amount]

    sqlLib.queryEscapedSql(query, inserts, (results) => {
        console.log("insert id ", results.insertId)
        console.log("affected rows ", results.affectedRows)
        inv_id = results.insertId

        // step2: add items to invoice_item table
        query = "insert into invoice_items (invoice_id, po_item_id, qty, price, cgst, sgst, igst, amount) values ?"
        var values = []
        for (var key in inv_values["items"]) {
            values.push([inv_id, inv_values["items"][key].po_item_id, inv_values["items"][key].billing_qty, inv_values["items"][key].price, 
                        inv_values["items"][key].cgst, inv_values["items"][key].sgst, inv_values["items"][key].igst, inv_values["items"][key].amount])
        }
        console.log(values)
        sqlLib.querymultiValuesSql(query, [values], (results) => {
            console.log("step2: affected rows ", results.affectedRows)
            //dc_id = results.insertId


            // step3: create gc_wc entry if flag set to true
            if(req.body.gc_wc_required)
            {
                inserts = []
                query = "insert into gc_wc_details (invoice_id, date, doc_loc) values (?, ?, ?) "
                inserts = [inv_id, inv_values.invoice_date, inv_values.gc_wc_location]
                sqlLib.queryEscapedSql(query, inserts, (results) => {
                    console.log("insert id ", results.insertId)
                    console.log("affected rows ", results.affectedRows)
                })
                
            }
                res.json({ "inv_num": inv_id })
        })
    })  
}

exports.add_payment_details = (req, res) => {   // Adds payment details for created invoice
    console.log("add_payment_details ", req.body);
    payment_details = req.body
    // first add po entry
    query = "insert into payments (invoice_id, payment_date, mode, amount, remarks) values (?, ?, ?, ?, ?)"
    inserts = [payment_details.invoice_num, payment_details.payment_date, payment_details.payment_mode,
    payment_details.amount, payment_details.remarks]

    sqlLib.queryEscapedSql(query, inserts, (results, err) => {
        if(err) res.json("error", err.code)
        else {
            console.log("insert id ", results.insertId)
            console.log("affected rows ", results.affectedRows)
            res.json("success")
        }
    })
}

exports.add_new_po = (req, res) => {
    console.log("add_new_po ", req.body, req.body.po_num, req.body.po_date);
    po_values = req.body
    // first add po entry
    query = "insert into purchase_orders (customer_id, po_num, po_date, delivery_date, entry_last_modified_date, remarks) values \
                ((select id from stakeholders where name = \"" + po_values.customer_name + "\"), \
                \"" + po_values.po_num + "\", \
                \"" + po_values.po_date + "\", \
                \"" + po_values.delivery_date + "\", \
                 now(), \"" + po_values.remarks + "\")";

    console.log(query);


    res.json("success")
}

exports.po_details = (req, res) => {  // GET items, dc list, inv list, credit note list, payment details in PO given po_number
    console.log("po_item_list");
    if (req.query.po_num != undefined) {
        // Get List of Items in the PO
        query = "select po_items.id as po_item_id, item_code, item_name, hsn_code, drawing_no, drawing_loc, \
                 total_qty, despatched_qty, rate, CGST, SGST, IGST from items \
                 inner join po_items on items.id = po_items.item_id \
                 inner join purchase_orders on po_items.po_id = purchase_orders.id \
                 where purchase_orders.po_num = ?"
        inserts = [req.query.po_num]
        var viewData = {}
        sqlLib.queryEscapedSql(query, inserts, (results) => {
            viewData["items"] = results
            console.log("view data:", viewData)
            res.json(viewData)
        })

        // Get List of DC in the PO


    }
    else {
        res.send("invalid query param")
    }
}

exports.po_item_list = (req, res) => {  // GET items in PO given po_number
    console.log("po_item_list");
    query = "select po_num, po_date, item_code, item_name, total_qty, despatched_qty, rate from purchase_orders \
                    inner join po_items on purchase_orders.id = po_items.po_id \
                    inner join items on po_items.item_id = items.id where po_num = \""
        + req.query.po_number + "\"";
    sqlLib.querySql(query, (results) => {
        res.json(results)
    })
}