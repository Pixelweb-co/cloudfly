import tkinter as tk
from tkinter import ttk
from tkinter import messagebox
from database.queries import get_all_customers
from ui.styles import BG_CARD, BG_MAIN, CLOUDFLY_BLUE, CLOUDFLY_BLUE_HOVER, WHITE, COLOR_SUCCESS, COLOR_DANGER, COLOR_WARNING, TEXT_MUTED, FONT_BOLD, FONT_NORMAL, COLOR_SUCCESS_HOVER, COLOR_DANGER_HOVER

class LoginModal(tk.Toplevel):
    def __init__(self, parent, api_client, on_success_callback):
        super().__init__(parent)
        self.api_client = api_client
        self.on_success = on_success_callback
        
        self.title("Iniciar Sesión - CloudFly POS")
        self.geometry("380x420")
        self.configure(bg=BG_MAIN)
        self.grab_set()  # Bloquear interacción con ventana padre
        self.resizable(False, False)
        
        # Centrar ventana
        self.transient(parent)
        self.center_window()
        
        # 1. LOGO DE CLOUDFLY
        self.logo_frame = tk.Frame(self, bg=BG_MAIN)
        self.logo_frame.pack(pady=(35, 10))
        
        self.logo_canvas = tk.Canvas(self.logo_frame, width=60, height=45, bg=BG_MAIN, highlightthickness=0)
        self.logo_canvas.pack(pady=5)
        # Nube azul
        self.logo_canvas.create_oval(5, 15, 35, 39, fill=CLOUDFLY_BLUE, outline="")
        self.logo_canvas.create_oval(20, 7, 50, 39, fill=CLOUDFLY_BLUE, outline="")
        self.logo_canvas.create_oval(30, 18, 56, 39, fill=CLOUDFLY_BLUE, outline="")
        self.logo_canvas.create_rectangle(18, 24, 46, 39, fill=CLOUDFLY_BLUE, outline="")
        # Burbuja chat
        self.logo_canvas.create_oval(18, 20, 36, 32, fill=WHITE, outline="")
        self.logo_canvas.create_polygon(20, 29, 18, 35, 27, 31, fill=WHITE, outline="")
        
        self.title_lbl = tk.Label(self, text="Acceso al Punto de Venta", fg=WHITE, bg=BG_MAIN, font=("Segoe UI", 16, "bold"))
        self.title_lbl.pack()
        self.subtitle_lbl = tk.Label(self, text="Por favor ingresa tus credenciales", fg=TEXT_MUTED, bg=BG_MAIN, font=("Segoe UI", 9))
        self.subtitle_lbl.pack(pady=(0, 25))
        
        # 2. CAMPOS DE TEXTO
        self.fields_frame = tk.Frame(self, bg=BG_MAIN)
        self.fields_frame.pack(fill="x", padx=40)
        
        # Usuario
        tk.Label(self.fields_frame, text="USUARIO DE ACCESO", fg=TEXT_MUTED, bg=BG_MAIN, font=("Segoe UI", 8, "bold")).pack(anchor="w")
        self.entry_user = tk.Entry(self.fields_frame, font=FONT_NORMAL, bg=BG_CARD, fg=WHITE, insertbackground=WHITE, bd=1, relief="solid")
        self.entry_user.pack(fill="x", pady=(5, 15), ipady=6)
        self.entry_user.insert(0, "admin")  # Credencial demo por defecto
        
        # Contraseña
        tk.Label(self.fields_frame, text="CONTRASEÑA", fg=TEXT_MUTED, bg=BG_MAIN, font=("Segoe UI", 8, "bold")).pack(anchor="w")
        self.entry_pass = tk.Entry(self.fields_frame, font=FONT_NORMAL, show="*", bg=BG_CARD, fg=WHITE, insertbackground=WHITE, bd=1, relief="solid")
        self.entry_pass.pack(fill="x", pady=(5, 10), ipady=6)
        self.entry_pass.insert(0, "admin123")  # Credencial demo por defecto
        
        # Mensaje de Error inline
        self.lbl_error = tk.Label(self, text="", fg=COLOR_DANGER, bg=BG_MAIN, font=("Segoe UI", 9, "bold"))
        self.lbl_error.pack(pady=5)
        
        # 3. BOTÓN DE INGRESO
        self.btn_login = tk.Button(
            self,
            text="INGRESAR A LA CAJA",
            bg=CLOUDFLY_BLUE,
            fg=WHITE,
            activebackground=CLOUDFLY_BLUE_HOVER,
            activeforeground=WHITE,
            font=FONT_BOLD,
            relief="flat",
            bd=0,
            cursor="hand2",
            command=self.perform_login,
            pady=10
        )
        self.btn_login.pack(fill="x", padx=40, pady=(10, 20))
        
        # Bind de enter
        self.bind("<Return>", lambda e: self.perform_login())

    def center_window(self):
        self.update_idletasks()
        width = self.winfo_width()
        height = self.winfo_height()
        x = (self.winfo_screenwidth() // 2) - (width // 2)
        y = (self.winfo_screenheight() // 2) - (height // 2)
        self.geometry(f"{width}x{height}+{x}+{y}")

    def perform_login(self):
        """Envía credenciales al backend API."""
        user = self.entry_user.get().strip()
        pwd = self.entry_pass.get().strip()
        
        if not user or not pwd:
            self.lbl_error.configure(text="Ingresa usuario y contraseña")
            return
            
        self.btn_login.configure(state="disabled", text="Autenticando...")
        self.update()
        
        # Llamar a la API
        success, message = self.api_client.login(user, pwd)
        
        if success:
            self.on_success()
            self.destroy()
        else:
            self.btn_login.configure(state="normal", text="INGRESAR A LA CAJA")
            self.lbl_error.configure(text=message)


class CustomerSelectionModal(tk.Toplevel):
    def __init__(self, parent, on_select_callback):
        super().__init__(parent)
        self.on_select = on_select_callback
        
        self.title("Seleccionar Cliente - CloudFly POS")
        self.geometry("500x480")
        self.configure(bg=BG_CARD)
        self.grab_set()
        self.resizable(False, False)
        
        # Centrar
        self.transient(parent)
        self.center_window()
        
        # 1. CABECERA Y BUSCADOR
        self.header_lbl = tk.Label(self, text="👤 Catálogo de Clientes / Contactos", fg=WHITE, bg=BG_CARD, font=("Segoe UI", 12, "bold"))
        self.header_lbl.pack(anchor="w", padx=20, pady=(20, 10))
        
        self.search_frame = tk.Frame(self, bg=BG_CARD)
        self.search_frame.pack(fill="x", padx=20, pady=5)
        
        self.entry_search = tk.Entry(self.search_frame, font=FONT_NORMAL, bg=BG_MAIN, fg=WHITE, insertbackground=WHITE, bd=1, relief="solid")
        self.entry_search.pack(side="left", fill="x", expand=True, ipady=6, padx=(0, 10))
        self.entry_search.bind("<KeyRelease>", self.on_search_change)
        
        # 2. TABLA DE CLIENTES
        self.table_frame = ttk.Frame(self)
        self.table_frame.pack(fill="both", expand=True, padx=20, pady=10)
        
        self.scrollbar = ttk.Scrollbar(self.table_frame, orient="vertical")
        self.tree = ttk.Treeview(self.table_frame, columns=("name", "phone", "email", "points"), show="headings", yscrollcommand=self.scrollbar.set)
        self.scrollbar.configure(command=self.tree.yview)
        
        self.tree.heading("name", text="Nombre")
        self.tree.heading("phone", text="Teléfono")
        self.tree.heading("email", text="Correo Electrónico")
        self.tree.heading("points", text="Puntos")
        
        self.tree.column("name", width=150, anchor="w")
        self.tree.column("phone", width=100, anchor="center")
        self.tree.column("email", width=140, anchor="w")
        self.tree.column("points", width=60, anchor="center")
        
        self.tree.pack(side="left", fill="both", expand=True)
        self.scrollbar.pack(side="right", fill="y")
        
        self.tree.bind("<Double-1>", self.on_select_confirm)
        
        # 3. ACCIONES
        self.actions_frame = tk.Frame(self, bg=BG_CARD)
        self.actions_frame.pack(fill="x", padx=20, pady=(10, 20))
        
        # Botón Cliente Mostrador (Desvincular)
        self.btn_walkin = ttk.Button(self.actions_frame, text="👤 Cliente Mostrador", style="TButton", command=self.on_select_walkin)
        self.btn_walkin.pack(side="left", padx=(0, 10))
        
        # Confirmar selección
        self.btn_confirm = ttk.Button(self.actions_frame, text="✓ Seleccionar Cliente", style="Success.TButton", command=self.on_select_confirm)
        self.btn_confirm.pack(side="right")
        
        self.refresh_list()

    def center_window(self):
        self.update_idletasks()
        width = self.winfo_width()
        height = self.winfo_height()
        x = (self.winfo_screenwidth() // 2) - (width // 2)
        y = (self.winfo_screenheight() // 2) - (height // 2)
        self.geometry(f"{width}x{height}+{x}+{y}")

    def on_search_change(self, e):
        self.refresh_list(self.entry_search.get().strip())

    def refresh_list(self, search_query=None):
        """Descarga/Obtiene y actualiza la lista visual de clientes."""
        for item in self.tree.get_children():
            self.tree.delete(item)
            
        try:
            customers = get_all_customers(search_query)
        except Exception as e:
            print(f"Error cargando clientes: {e}")
            customers = []
            
        for c in customers:
            # Crear referencia interna guardando el ID en iid
            self.tree.insert(
                "",
                "end",
                iid=str(c['id']),
                values=(
                    c['name'],
                    c['phone'] or "---",
                    c['email'] or "---",
                    f"{c['points']} pts"
                )
            )

    def on_select_confirm(self, event=None):
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("Seleccionar Cliente", "Por favor seleccione un cliente de la lista.", parent=self)
            return
            
        customer_id = int(selected[0])
        # Buscar el registro completo
        from models.customer import Customer
        conn = get_all_customers()
        cust_dict = next((c for c in conn if c['id'] == customer_id), None)
        if cust_dict:
            self.on_select(Customer.from_dict(cust_dict))
            self.destroy()

    def on_select_walkin(self):
        """Restablece a cliente mostrador (None)."""
        self.on_select(None)
        self.destroy()


class PaymentModal(tk.Toplevel):
    def __init__(self, parent, total, payment_method, on_payment_confirm_callback):
        super().__init__(parent)
        self.total = float(total)
        self.payment_method = payment_method
        self.on_confirm = on_payment_confirm_callback
        
        self.title("Procesar Cobro - CloudFly POS")
        self.geometry("380x360")
        self.configure(bg=BG_CARD)
        self.grab_set()
        self.resizable(False, False)
        
        # Centrar
        self.transient(parent)
        self.center_window()
        
        # 1. TOTAL A COBRAR
        tk.Label(self, text="TOTAL A COBRAR", fg=TEXT_MUTED, bg=BG_CARD, font=("Segoe UI", 9, "bold")).pack(pady=(20, 2))
        self.lbl_total = tk.Label(self, text=f"${self.total:.2f}", fg=COLOR_SUCCESS, bg=BG_CARD, font=("Segoe UI", 28, "bold"))
        self.lbl_total.pack(pady=(0, 15))
        
        # Metodo de pago visible
        method_labels = {
            "CASH": "💵 EFECTIVO",
            "CARD": "💳 TARJETA DE CRÉDITO/DÉBITO",
            "TRANSFER": "📲 TRANSFERENCIA BANCARIA",
            "OTHER": "Otros Métodos de Pago"
        }
        self.lbl_method = tk.Label(self, text=method_labels.get(payment_method, payment_method), fg=WHITE, bg=BG_CARD, font=FONT_BOLD)
        self.lbl_method.pack(pady=5)
        
        # 2. SECCIÓN EFECTIVO (Ingresar recibido y calcular cambio)
        self.cash_calc_frame = tk.Frame(self, bg=BG_CARD)
        
        if payment_method == "CASH":
            self.cash_calc_frame.pack(fill="x", padx=40, pady=10)
            
            # Recibido
            tk.Label(self.cash_calc_frame, text="MONTO RECIBIDO:", fg=TEXT_MUTED, bg=BG_CARD, font=("Segoe UI", 9, "bold")).pack(anchor="w")
            self.entry_received = tk.Entry(self.cash_calc_frame, font=("Segoe UI", 16, "bold"), bg=BG_MAIN, fg=WHITE, insertbackground=WHITE, bd=1, relief="solid", justify="center")
            self.entry_received.pack(fill="x", pady=(5, 10), ipady=6)
            self.entry_received.bind("<KeyRelease>", self.on_received_change)
            self.entry_received.focus_set()
            
            # Cambio
            self.change_frame = tk.Frame(self.cash_calc_frame, bg=BG_CARD)
            self.change_frame.pack(fill="x")
            tk.Label(self.change_frame, text="CAMBIO A ENTREGAR:", fg=TEXT_MUTED, bg=BG_CARD, font=("Segoe UI", 9, "bold")).pack(side="left")
            self.lbl_change = tk.Label(self.change_frame, text="$0.00", fg=COLOR_WARNING, bg=BG_CARD, font=("Segoe UI", 16, "bold"))
            self.lbl_change.pack(side="right")
        else:
            # Para otros métodos no es necesario calculadora de efectivo
            tk.Label(self, text="Por favor confirme la transacción en la terminal.", fg=TEXT_MUTED, bg=BG_CARD, font=FONT_NORMAL).pack(pady=20)
            
        # 3. BOTÓN CONFIRMAR
        self.btn_confirm = tk.Button(
            self,
            text="✓ COMPLETAR TRANSACCIÓN",
            bg=COLOR_SUCCESS,
            fg=WHITE,
            activebackground=COLOR_SUCCESS_HOVER,
            activeforeground=WHITE,
            font=FONT_BOLD,
            relief="flat",
            bd=0,
            cursor="hand2",
            command=self.confirm_payment,
            pady=12
        )
        self.btn_confirm.pack(fill="x", padx=40, pady=(20, 20))
        
        # Binds
        self.bind("<Return>", lambda e: self.confirm_payment())

    def center_window(self):
        self.update_idletasks()
        width = self.winfo_width()
        height = self.winfo_height()
        x = (self.winfo_screenwidth() // 2) - (width // 2)
        y = (self.winfo_screenheight() // 2) - (height // 2)
        self.geometry(f"{width}x{height}+{x}+{y}")

    def on_received_change(self, e):
        """Calcula el cambio exacto a retornar en tiempo real."""
        try:
            received_str = self.entry_received.get().strip()
            if not received_str:
                self.lbl_change.configure(text="$0.00", fg=COLOR_WARNING)
                return
                
            received = float(received_str)
            change = received - self.total
            
            if change >= 0:
                self.lbl_change.configure(text=f"${change:.2f}", fg=COLOR_SUCCESS)
                if hasattr(self, 'btn_confirm'):
                    self.btn_confirm.configure(state="normal")
            else:
                self.lbl_change.configure(text="Monto Insuficiente", fg=COLOR_DANGER)
                # No bloquear, el usuario podría procesar un abono, pero advertimos
        except ValueError:
            self.lbl_change.configure(text="Monto Inválido", fg=COLOR_DANGER)

    def confirm_payment(self):
        """Verifica que el cobro es correcto y dispara el callback de finalización."""
        if self.payment_method == "CASH":
            try:
                received_str = self.entry_received.get().strip()
                if not received_str:
                    messagebox.showerror("Error de Cobro", "Por favor ingrese el monto recibido.", parent=self)
                    return
                received = float(received_str)
                if received < self.total:
                    if not messagebox.askyesno("Monto Insuficiente", "El monto recibido es menor al total. ¿Desea continuar con esta venta al crédito o abono?", parent=self):
                        return
            except ValueError:
                messagebox.showerror("Monto Inválido", "Por favor ingrese un número válido.", parent=self)
                return
                
        # Éxito, disparar callback
        self.on_confirm()
        self.destroy()
