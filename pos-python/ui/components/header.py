import tkinter as tk
from tkinter import ttk
import datetime
from ui.styles import BG_CARD, CLOUDFLY_BLUE, WHITE, TEXT_MUTED, FONT_BOLD

class HeaderPanel(ttk.Frame):
    def __init__(self, parent, controller):
        super().__init__(parent, style="Card.TFrame")
        self.controller = controller
        
        # Padding interno del encabezado
        self.configure(padding=(15, 10))
        
        # Configurar columnas responsivas en el header
        self.columnconfigure(0, weight=2)  # Logo y Marca
        self.columnconfigure(1, weight=2)  # Info Factura
        self.columnconfigure(2, weight=1)  # Stats
        self.columnconfigure(3, weight=2)  # Cliente y Puntos
        
        # 1. LOGO Y MARCA (Visualización estilizada inspirada en el logo)
        self.brand_frame = ttk.Frame(self, style="Card.TFrame")
        self.brand_frame.grid(row=0, column=0, sticky="w")
        
        # Crear un Canvas pequeño para dibujar la nube azul de CloudFly
        self.logo_canvas = tk.Canvas(self.brand_frame, width=40, height=30, bg=BG_CARD, highlightthickness=0)
        self.logo_canvas.pack(side="left", padx=(0, 10))
        # Dibujar nube estilizada (círculos y elipse en azul logo)
        self.logo_canvas.create_oval(5, 10, 25, 26, fill=CLOUDFLY_BLUE, outline="")
        self.logo_canvas.create_oval(15, 5, 35, 26, fill=CLOUDFLY_BLUE, outline="")
        self.logo_canvas.create_oval(20, 12, 38, 26, fill=CLOUDFLY_BLUE, outline="")
        self.logo_canvas.create_rectangle(12, 16, 32, 26, fill=CLOUDFLY_BLUE, outline="")
        # Dibujar una mini burbuja de chat dentro de la nube
        self.logo_canvas.create_oval(12, 14, 24, 22, fill=WHITE, outline="")
        self.logo_canvas.create_polygon(14, 20, 12, 24, 18, 21, fill=WHITE, outline="")
        
        # Crear un frame para los textos alineados verticalmente
        self.text_container = ttk.Frame(self.brand_frame, style="Card.TFrame")
        self.text_container.pack(side="left", fill="both", expand=True)
        
        # Fila superior: Nombre de la marca
        self.titles_row = ttk.Frame(self.text_container, style="Card.TFrame")
        self.titles_row.pack(side="top", anchor="w")
        
        self.lbl_cloud = ttk.Label(self.titles_row, text="cloud", font=("Segoe UI", 20, "bold"), foreground=WHITE, style="Card.TLabel")
        self.lbl_cloud.pack(side="left")
        self.lbl_fly = ttk.Label(self.titles_row, text="fly", font=("Segoe UI", 20, "bold"), foreground=CLOUDFLY_BLUE, style="Card.TLabel")
        self.lbl_fly.pack(side="left")
        self.lbl_pos = ttk.Label(self.titles_row, text="POS Desktop", font=("Segoe UI", 9, "italic"), foreground=TEXT_MUTED, style="Card.TLabel")
        self.lbl_pos.pack(side="left", padx=8, pady=(8, 0))
        
        # Fila inferior: Usuario y Rol
        self.lbl_user_info = ttk.Label(self.text_container, text="👤 Cargando...", font=("Segoe UI", 9, "bold"), foreground=TEXT_MUTED, style="Card.TLabel")
        self.lbl_user_info.pack(side="top", anchor="w", pady=(2, 0))
        
        # 2. INFORMACIÓN DE FACTURA
        self.factura_frame = ttk.Frame(self, style="Card.TFrame")
        self.factura_frame.grid(row=0, column=1, sticky="w")
        
        self.lbl_invoice_num = ttk.Label(self.factura_frame, text="FACTURA N°: ---", font=("Segoe UI", 12, "bold"), foreground=WHITE, style="Card.TLabel")
        self.lbl_invoice_num.pack(anchor="w")
        
        self.lbl_datetime = ttk.Label(self.factura_frame, text="FECHA: --/--/---- --:--:--", font=("Segoe UI", 10), foreground=TEXT_MUTED, style="Card.TLabel")
        self.lbl_datetime.pack(anchor="w", pady=(2, 0))
        
        # 3. STATS DEL CARRITO (LÍNEAS Y CANTIDADES)
        self.stats_frame = ttk.Frame(self, style="Card.TFrame")
        self.stats_frame.grid(row=0, column=2, sticky="w")
        
        self.lbl_lines = ttk.Label(self.stats_frame, text="LÍNEAS: 0", font=FONT_BOLD, foreground=CLOUDFLY_BLUE, style="Card.TLabel")
        self.lbl_lines.pack(anchor="w")
        self.lbl_quantity = ttk.Label(self.stats_frame, text="CANTIDAD: 0", font=FONT_BOLD, foreground=WHITE, style="Card.TLabel")
        self.lbl_quantity.pack(anchor="w", pady=(2, 0))
        
        # 4. CLIENTE Y PUNTOS
        self.customer_frame = ttk.Frame(self, style="Card.TFrame")
        self.customer_frame.grid(row=0, column=3, sticky="e")
        
        self.btn_customer = ttk.Button(self.customer_frame, text="👤 Seleccionar Cliente", style="Primary.TButton", command=self.on_customer_click)
        self.btn_customer.pack(side="left", padx=(0, 12))
        
        self.customer_info_frame = ttk.Frame(self.customer_frame, style="Card.TFrame")
        self.customer_info_frame.pack(side="left")
        
        self.lbl_cust_name = ttk.Label(self.customer_info_frame, text="Mostrador", font=FONT_BOLD, foreground=WHITE, style="Card.TLabel")
        self.lbl_cust_name.pack(anchor="w")
        self.lbl_cust_points = ttk.Label(self.customer_info_frame, text="Puntos: 0 pts", font=("Segoe UI", 10), foreground=TEXT_MUTED, style="Card.TLabel")
        self.lbl_cust_points.pack(anchor="w")
        
        # Iniciar el reloj en vivo
        self.update_clock()

    def update_clock(self):
        """Actualiza el reloj en la interfaz cada segundo."""
        now = datetime.datetime.now().strftime("FECHA: %d/%m/%Y  %H:%M:%S")
        self.lbl_datetime.configure(text=now)
        self.after(1000, self.update_clock)

    def update_invoice_number(self, invoice_number):
        """Actualiza el número de factura visible."""
        self.lbl_invoice_num.configure(text=f"FACTURA N°: {invoice_number}")

    def update_stats(self, line_count, total_qty):
        """Actualiza las estadísticas de líneas y cantidades totales."""
        self.lbl_lines.configure(text=f"LÍNEAS: {line_count}")
        self.lbl_quantity.configure(text=f"CANTIDAD: {total_qty}")

    def update_customer(self, customer):
        """Actualiza la información del cliente actual en el encabezado."""
        if customer:
            self.lbl_cust_name.configure(text=customer.name)
            self.lbl_cust_points.configure(text=f"Puntos: {customer.points} pts")
            self.btn_customer.configure(text="👤 Cambiar Cliente")
        else:
            self.lbl_cust_name.configure(text="Mostrador")
            self.lbl_cust_points.configure(text="Puntos: 0 pts")
            self.btn_customer.configure(text="👤 Seleccionar Cliente")

    def on_customer_click(self):
        """Llama al controlador para abrir el modal de selección de clientes."""
        self.controller.open_customer_modal()

    def update_user_info(self, username, role):
        """Actualiza la información del usuario logueado en la interfaz."""
        if username and role:
            # Color verde esmeralda del logo para el usuario logueado activo
            self.lbl_user_info.configure(text=f"👤 {username} ({role})", foreground="#10b981")
        else:
            self.lbl_user_info.configure(text="👤 Sin Sesión", foreground="#94a3b8")
