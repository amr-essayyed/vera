frappe.ui.form.on("Customer", {
    refresh(frm) {
        if (!frm.doc.__islocal) {
            // Add Master Orders section in the dashboard
            frm.dashboard.add_transactions([
                {
                    label: __("Orders"),
                    items: ["Master Order"]
                }
            ]);

            // Fetch total Master Orders amount
            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "Master Order",
                    filters: { customer: frm.doc.name },
                    fields: ["sales_total"]
                },
                callback: function(r) {
                    let total = 0;
                    (r.message || []).forEach(d => {
                        total += d.sales_total || 0;
                    });

                    frm.dashboard.add_indicator(
                        __("Master Orders Total: ") + total,
                        total > 0 ? "blue" : "grey"
                    );
                }
            });
        }
    }
});
