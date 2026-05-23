import tkinter as tk
from tkinter import ttk
from tkinter import messagebox
from ui.styles import BG_CARD, WHITE, CLOUDFLY_BLUE, COLOR_SUCCESS, COLOR_DANGER, COLOR_WARNING, TEXT_MUTED, FONT_BOLD, FONT_NORMAL, FONT_TOTAL

class CartPanel(ttk.Frame):
    def __init__(self, parent, controller):
        super().__init__(parent, style="Card.TFrame")
        self.controller = controller
        
        # Configurar cuadrícula de CartPanel para evitar recortes
        self.rowconfigure(0, weight=0)  # Título
        self.rowconfigure(1, weight=1)  # Tabla (Única expandible!)
        self.rowconfigure(2, weight=0)  # Totales
        self.rowconfigure(3, weight=0)  # Pagos
        self.rowconfigure(4, weight=0)  # Controles
        self.columnconfigure(0, weight=1)
        
        # 1. TÍTULO DE SECCIÓN
        self.title_lbl = ttk.Label(self, text="🛒 CARRITO DE COMPRAS", font=("Segoe UI", 12, "bold"), foreground=WHITE, style="Card.TLabel")
        self.title_lbl.grid(row=0, column=0, sticky="w", pady=(0, 6))
        
        # 2. TABLA DE TRANSACCIONES (Treeview + Scrollbar)
        self.table_frame = ttk.Frame(self)
        self.table_frame.grid(row=1, column=0, sticky="nsew", pady=4)
        
        self.scrollbar = ttk.Scrollbar(self.table_frame, orient="vertical")
        self.tree = ttk.Treeview(self.table_frame, columns=("desc", "qty", "disc", "price", "total"), show="headings", yscrollcommand=self.scrollbar.set, height=5)
        
        self.scrollbar.configure(command=self.tree.yview)
        
        # Encabezados
        self.tree.heading("desc", text="Descripción")
        self.tree.heading("qty", text="Cant.")
        self.tree.heading("disc", text="Desc.")
        self.tree.heading("price", text="Precio")
        self.tree.heading("total", text="Total")
        
        # Anchos de columna
        self.tree.column("desc", width=140, anchor="w")
        self.tree.column("qty", width=45, anchor="center")
        self.tree.column("disc", width=55, anchor="e")
        self.tree.column("price", width=65, anchor="e")
        self.tree.column("total", width=75, anchor="e")
        
        self.tree.pack(side="left", fill="both", expand=True)
        self.scrollbar.pack(side="right", fill="y")
        
        # Evento doble clic para editar fila
        self.tree.bind("<Double-1>", self.on_row_double_click)
        
        # Menú contextual de click derecho para eliminar
        self.context_menu = tk.Menu(self, tearoff=0, bg=BG_CARD, fg=WHITE)
        self.context_menu.add_command(label="❌ Eliminar del Carrito", command=self.on_remove_item)
        self.tree.bind("<Button-3>", self.show_context_menu)
        
        # 3. SECCIÓN DE TOTALES (En la parte inferior)
        self.totals_frame = ttk.Frame(self, style="Card.TFrame")
        self.totals_frame.grid(row=2, column=0, sticky="ew", pady=4)
        
        # Grid para subtotales, impuestos, descuentos y total
        self.totals_frame.columnconfigure(0, weight=1)
        self.totals_frame.columnconfigure(1, weight=1)
        
        # Subtotal
        self.lbl_subtotal_tag = ttk.Label(self.totals_frame, text="SUBTOTAL:", font=FONT_BOLD, foreground=TEXT_MUTED, style="Card.TLabel")
        self.lbl_subtotal_tag.grid(row=0, column=0, sticky="w", pady=1)
        self.lbl_subtotal = ttk.Label(self.totals_frame, text="$0.00", font=FONT_BOLD, style="Card.TLabel")
        self.lbl_subtotal.grid(row=0, column=1, sticky="e", pady=1)
        
        # Descuentos
        self.lbl_discount_tag = ttk.Label(self.totals_frame, text="DESCUENTO:", font=FONT_BOLD, foreground=TEXT_MUTED, style="Card.TLabel")
        self.lbl_discount_tag.grid(row=1, column=0, sticky="w", pady=1)
        self.lbl_discount = ttk.Label(self.totals_frame, text="-$0.00", font=FONT_BOLD, foreground=COLOR_DANGER, style="Card.TLabel")
        self.lbl_discount.grid(row=1, column=1, sticky="e", pady=1)
        
        # Impuesto (IVA)
        self.lbl_tax_tag = ttk.Label(self.totals_frame, text="IMPUESTO (0%):", font=FONT_BOLD, foreground=TEXT_MUTED, style="Card.TLabel")
        self.lbl_tax_tag.grid(row=2, column=0, sticky="w", pady=1)
        self.lbl_tax = ttk.Label(self.totals_frame, text="$0.00", font=FONT_BOLD, style="Card.TLabel")
        self.lbl_tax.grid(row=2, column=1, sticky="e", pady=1)
        
        # TOTAL GRANDE
        self.lbl_total_tag = ttk.Label(self.totals_frame, text="TOTAL A PAGAR:", font=("Segoe UI", 12, "bold"), foreground=WHITE, style="Card.TLabel")
        self.lbl_total_tag.grid(row=3, column=0, sticky="w", pady=(6, 0))
        self.lbl_total = ttk.Label(self.totals_frame, text="$0.00", style="Total.TLabel")
        self.lbl_total.grid(row=3, column=1, sticky="e", pady=(6, 0))
        
        # 4. BOTONES DE PAGO RÁPIDO
        self.payment_frame = ttk.Frame(self, style="Card.TFrame")
        self.payment_frame.grid(row=3, column=0, sticky="ew", pady=4)
        
        self.payment_frame.columnconfigure(0, weight=1)
        self.payment_frame.columnconfigure(1, weight=1)
        self.payment_frame.columnconfigure(2, weight=1)
        
        # Efectivo (Emerald)
        self.btn_cash = ttk.Button(self.payment_frame, text="💵 Efectivo", style="Success.TButton", command=lambda: self.on_pay_click("CASH"))
        self.btn_cash.grid(row=0, column=0, padx=2, pady=2, sticky="ew")
        
        # Tarjeta (CloudFly Blue)
        self.btn_card = ttk.Button(self.payment_frame, text="💳 Tarjeta", style="Primary.TButton", command=lambda: self.on_pay_click("CARD"))
        self.btn_card.grid(row=0, column=1, padx=2, pady=2, sticky="ew")
        
        # Transferencia (Warning)
        self.btn_transfer = ttk.Button(self.payment_frame, text="📲 Transf.", style="Warning.TButton", command=lambda: self.on_pay_click("TRANSFER"))
        self.btn_transfer.grid(row=0, column=2, padx=2, pady=2, sticky="ew")
 
        # 5. BOTONES DE CONTROL DE VENTA
        self.control_frame = ttk.Frame(self, style="Card.TFrame")
        self.control_frame.grid(row=4, column=0, sticky="ew", pady=(4, 0))
        
        self.control_frame.columnconfigure(0, weight=1)
        self.control_frame.columnconfigure(1, weight=1)
        
        # Limpiar
        self.btn_clear = ttk.Button(self.control_frame, text="🧹 Vaciar Carrito", style="Danger.TButton", command=self.on_clear_click)
        self.btn_clear.grid(row=0, column=0, padx=2, pady=2, sticky="ew")
        
        # Consultar / Sincronizar
        self.btn_sync = ttk.Button(self.control_frame, text="🔄 Sincronizar Catálogo", style="TButton", command=self.on_sync_click)
        self.btn_sync.grid(row=0, column=1, padx=2, pady=2, sticky="ew")

    def refresh_cart_table(self, cart):
        """Redibuja todas las líneas de transacciones basadas en el estado del carrito."""
        # Limpiar tabla
        for item in self.tree.get_children():
            self.tree.delete(item)
            
        # Rellenar filas
        for item in cart.items:
            # Obtener ID del producto para referencia interna
            self.tree.insert(
                "",
                "end",
                iid=str(item.product.id),
                values=(
                    item.product.name,
                    item.quantity,
                    f"${item.discount:.2f}",
                    f"${item.unit_price:.2f}",
                    f"${item.total:.2f}"
                )
            )
            
        # Actualizar los labels de totales
        self.lbl_subtotal.configure(text=f"${cart.subtotal:.2f}")
        self.lbl_discount.configure(text=f"-${cart.discount:.2f}")
        self.lbl_tax_tag.configure(text=f"IMPUESTO ({cart.tax_percent}%):")
        self.lbl_tax.configure(text=f"${cart.tax:.2f}")
        self.lbl_total.configure(text=f"${cart.total:.2f}")

    def show_context_menu(self, event):
        """Muestra menú de click derecho para borrar items."""
        item = self.tree.identify_row(event.y)
        if item:
            self.tree.selection_set(item)
            self.context_menu.post(event.x_root, event.y_root)

    def on_remove_item(self):
        """Elimina el item seleccionado del carrito."""
        selected = self.tree.selection()
        if selected:
            product_id = int(selected[0])
            self.controller.remove_product_from_cart(product_id)

    def on_row_double_click(self, event):
        """Abre un pop-up para editar la cantidad y descuento del item seleccionado."""
        selected = self.tree.selection()
        if not selected:
            return

        product_id = int(selected[0])
        cart_item = None
        for item in self.controller.cart.items:
            if item.product.id == product_id:
                cart_item = item
                break

        if not cart_item:
            return

        # --- Ventana modal ---
        edit_win = tk.Toplevel(self)
        edit_win.title("Modificar Item")
        edit_win.configure(bg=BG_CARD)
        edit_win.grab_set()
        edit_win.resizable(False, False)
        edit_win.transient(self)

        # Título del producto
        tk.Label(
            edit_win,
            text=cart_item.product.name,
            fg=WHITE,
            bg=BG_CARD,
            font=FONT_BOLD,
            wraplength=260,
            justify="center"
        ).pack(fill="x", padx=20, pady=(18, 10))

        # Separador visual
        tk.Frame(edit_win, bg="#334155", height=1).pack(fill="x", padx=20, pady=(0, 12))

        # --- Campo Cantidad ---
        qty_frame = tk.Frame(edit_win, bg=BG_CARD)
        qty_frame.pack(fill="x", padx=24, pady=5)
        tk.Label(qty_frame, text="Cantidad:", fg=TEXT_MUTED, bg=BG_CARD, font=FONT_NORMAL, width=14, anchor="w").pack(side="left")
        entry_qty = tk.Entry(
            qty_frame, font=FONT_NORMAL, width=10,
            bg="#0f172a", fg=WHITE, insertbackground=WHITE,
            relief="flat", bd=4
        )
        entry_qty.pack(side="right")
        entry_qty.insert(0, str(cart_item.quantity))
        entry_qty.focus_set()

        # --- Campo Descuento ---
        disc_frame = tk.Frame(edit_win, bg=BG_CARD)
        disc_frame.pack(fill="x", padx=24, pady=5)
        tk.Label(disc_frame, text="Descuento ($):", fg=TEXT_MUTED, bg=BG_CARD, font=FONT_NORMAL, width=14, anchor="w").pack(side="left")
        entry_disc = tk.Entry(
            disc_frame, font=FONT_NORMAL, width=10,
            bg="#0f172a", fg=WHITE, insertbackground=WHITE,
            relief="flat", bd=4
        )
        entry_disc.pack(side="right")
        entry_disc.insert(0, f"{cart_item.discount:.2f}")

        # Separador visual
        tk.Frame(edit_win, bg="#334155", height=1).pack(fill="x", padx=20, pady=(14, 0))

        # --- Botones ---
        btn_frame = tk.Frame(edit_win, bg=BG_CARD)
        btn_frame.pack(fill="x", padx=20, pady=14)

        def save_changes():
            try:
                new_qty = int(entry_qty.get())
                new_disc = float(entry_disc.get())
                if new_qty <= 0:
                    raise ValueError("La cantidad debe ser mayor a cero")
                if new_disc < 0:
                    raise ValueError("El descuento no puede ser negativo")
                self.controller.update_cart_item(product_id, new_qty, new_disc)
                edit_win.destroy()
            except ValueError as ve:
                messagebox.showerror("Error", str(ve) or "Ingrese valores validos.", parent=edit_win)

        btn_cancel = tk.Button(
            btn_frame, text="Cancelar",
            bg="#334155", fg=WHITE, activebackground="#475569", activeforeground=WHITE,
            font=FONT_NORMAL, relief="flat", bd=0, padx=14, pady=8,
            cursor="hand2", command=edit_win.destroy
        )
        btn_cancel.pack(side="left", padx=(0, 8))

        btn_save = tk.Button(
            btn_frame, text="  Guardar Cambios  ",
            bg="#10b981", fg=WHITE, activebackground="#059669", activeforeground=WHITE,
            font=FONT_BOLD, relief="flat", bd=0, padx=14, pady=8,
            cursor="hand2", command=save_changes
        )
        btn_save.pack(side="right")

        # Bind Enter para guardar
        edit_win.bind("<Return>", lambda e: save_changes())

        # Forzar renderizado y luego calcular tamaño real
        edit_win.update_idletasks()
        w = edit_win.winfo_reqwidth() + 20
        h = edit_win.winfo_reqheight() + 10
        sw = edit_win.winfo_screenwidth()
        sh = edit_win.winfo_screenheight()
        x = (sw - w) // 2
        y = (sh - h) // 2
        edit_win.geometry(f"{w}x{h}+{x}+{y}")

    def on_pay_click(self, payment_method):
        """Pasa la acción de pagar al controlador principal."""
        if self.controller.cart.line_count == 0:
            messagebox.showwarning("Carrito Vacío", "No hay productos en el carrito para realizar una venta.")
            return
        self.controller.open_payment_modal(payment_method)

    def on_clear_click(self):
        """Vacía el carrito después de confirmar."""
        if self.controller.cart.line_count == 0:
            return
        if messagebox.askyesno("Vaciar Carrito", "¿Está seguro que desea eliminar todos los ítems del carrito?"):
            self.controller.clear_cart()

    def on_sync_click(self):
        """Forzar sincronización de catálogo con el backend."""
        self.controller.force_catalog_sync()
