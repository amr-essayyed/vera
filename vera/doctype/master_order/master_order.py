# Copyright (c) 2025, Amr and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class MasterOrder(Document):
    def onload(self):
        if self.sales_order:
            sales_order = frappe.get_value("Sales Order", self.sales_order, "grand_total")
            self.sales_total = sales_order
    pass