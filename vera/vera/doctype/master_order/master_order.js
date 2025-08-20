// Copyright (c) 2025, Amr and contributors
// For license information, please see license.txt

frappe.ui.form.on("Master Order", {
    onload(frm) {
        console.log("loaded");
        
    },
    setup(frm) {
        console.log("setupped");
        handle_PO_sections(frm)
    },
	refresh(frm) {
        // frappe.show_alert("refreshed")

        // chanage add row button value
        frm.fields_dict["purchase_orders"].grid.wrapper
            .find('.grid-add-row')
            .text("➕ Add Purchase Order");
        
        // add purchase order button
        add_PO_buttons(frm);
        filter_sales_orders(frm)
        handle_PO_sections(frm)
        
        // When creating a new Sales Order from link field
        frm.fields_dict["sales_order"].df.get_route_options_for_new_doc = function() {
            if (!frm.doc.customer || !frm.doc.delivery_date) {
                frappe.throw("Please select a Customer & Delivery Date first");
            }
            return {
                customer: frm.doc.customer,
                delivery_date: frm.doc.delivery_date
            };
        };
        
        
	},
    sales_order(frm) {
        console.log("filed changed")
        add_PO_buttons(frm);
        filter_sales_orders(frm)
        
        // add sales order presentation table
        if (frm.doc.sales_order) {
            frappe.call({
                method: "frappe.client.get",
                args: {
                    doctype: "Sales Order",
                    name: frm.doc.sales_order  // assumes you linked a sales order
                },
                callback: function(r) {
                    if (r.message) {
                        // Clear existing table
                        frm.clear_table("items");

                        // Loop through child table
                        (r.message.items || []).forEach(function(row) {
                            let child = frm.add_child("items");
                            child.item_code = row.item_code;
                            child.item_name = row.item_name;
                            child.qty = row.qty;
                            child.rate = row.rate;
                            child.amount = row.amount;
                            child.uom = row.uom;
                            child.conversion_factor = row.conversion_factor;
                        });

                        frm.refresh_field("items");
                    }
                }
            });
        } else {
            frm.clear_table("items");
            frm.refresh_field("items");
        }

    },
    customer(frm) {
        filter_sales_orders(frm)
    }
});

frappe.ui.form.on('Master Order Purchase Item', {
	refresh(frm) {
		
	},
    purchase_order(frm, cdt, cdn) {
        handle_PO_sections(frm)

    }
})


function add_PO_buttons(frm) {
    if (!frm.doc.sales_order) {
            frm.add_custom_button("Create New Sales Order", ()=>{
                frappe.show_alert("works")
            })
        }else {
             frm.remove_custom_button("Create New Sales Order")
        }
}

function filter_sales_orders(frm) {
    // filter for cutomer name in sales orders
    // Apply custom logic to the Sales Order link field
    frm.fields_dict["sales_order"].get_query = function() {
        return {
            filters: {
                customer: frm.doc.customer
            }
        };
    };
}

function handle_PO_sections(frm) {
    const wrapper = frm.fields_dict["po_html"].$wrapper;
    wrapper.empty(); // clear old sections

    for (let itm of frm.doc.purchase_orders){
        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "Purchase Order",
                name: itm.purchase_order
            },
            callback: function(r) {
                if (r.message) {
                    console.log(r.message);  // This is your Purchase Order doc
                    // create a section
                    fetch_POs(frm, r.message)
                }
            }
        });             
        
    }
}

function fetch_POs(frm, po_doc) {
    const wrapper = frm.fields_dict["po_html"].$wrapper;

    // build PO section
    let section = $(`
        <div class="form-section">
            <div class="section-head">
                📦 ${po_doc.name} — ${po_doc.supplier}
                <button class="btn btn-xs btn-primary pull-right view-po-btn" style="margin-left:10px;">
                    View Form
                </button>
            </div>
            <div class="section-body">
                <p><b>Date:</b> ${po_doc.transaction_date}</p>
                <p><b>Grand Total:</b> ${po_doc.grand_total}</p>
                <table class="table table-bordered" style="margin-top:10px;">
                    <thead>
                        <tr>
                            <th>Item Code</th>
                            <th>Item Name</th>
                            <th>Qty</th>
                            <th>Rate</th>
                            <th>Amount</th>
                            <th>UOM</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    `);

    // append rows for items
    (po_doc.items || []).forEach(itm => {
        section.find("tbody").append(`
            <tr>
                <td>${itm.item_code}</td>
                <td>${itm.item_name}</td>
                <td>${itm.qty}</td>
                <td>${itm.rate}</td>
                <td>${itm.amount}</td>
                <td>${itm.uom}</td>
            </tr>
        `);
    });

    // attach click event to button
    section.find(".view-po-btn").on("click", function() {
        frappe.set_route("Form", "Purchase Order", po_doc.name);
    });

    // finally add to wrapper (as last child)
    wrapper.append(section);
}