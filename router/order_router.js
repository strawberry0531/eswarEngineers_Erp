const express = require("express");
const router = express.Router();

const orderController = require("../controller/order_controller")


router.get("/", orderController.order_list)

router.get("/by_item_name", orderController.item_name_po_list)

router.post("/create_dc", orderController.create_dc)

router.post("/create_credit_note", orderController.create_credit_note)

router.post("/create_invoice", orderController.create_invoice)

router.post("/add_payment_details", orderController.add_payment_details)

router.get("/po_details", orderController.po_details)

router.get("/item_list", orderController.po_item_list)

router.post("/add_new_po", orderController.add_new_po)

module.exports = router