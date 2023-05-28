const express = require("express");
const router = express.Router();

const itemsController = require("../controller/items_controller")


router.get("/", itemsController.items_list)

router.get("/item_name_material_detail", itemsController.item_name_material_detail)

router.get("/item_name_po_list", itemsController.item_name_po_list)

module.exports = router