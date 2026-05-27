import tkinter as tk
from tkinter import ttk
from ui.styles import BG_CARD, WHITE, FONT_BOLD, create_hover_effect

FONT_BTN_KEYS = ("Segoe UI", 9, "bold")

class FunctionKeysPanel(ttk.Frame):
    def __init__(self, parent, controller):
        super().__init__(parent, style="Card.TFrame")
        self.controller = controller
        
        # Padding interno
        self.configure(padding=4)
        
        # Crear cuadrícula de 3 filas y 6 columnas
        for r in range(3):
            self.rowconfigure(r, weight=1)
        for c in range(6):
            self.columnconfigure(c, weight=1)
            
        # Definición de botones (Fila, Columna, Texto, Color de Fondo, Hover, Acción)
        # Usamos botones estándar de Tkinter personalizados para pintar colores específicos impecables
        self.buttons_config = [
            # FILA 1
            {"row": 0, "col": 0, "text": "⏱️ ESPERA", "bg": "#8b5cf6", "hover": "#7c3aed", "cmd": self.on_espera},
            {"row": 0, "col": 1, "text": "📂 RECUPERAR", "bg": "#06b6d4", "hover": "#0891b2", "cmd": self.on_recuperar},
            {"row": 0, "col": 2, "text": "🔍 CONSULTAR", "bg": "#22d3ee", "hover": "#06b6d4", "cmd": self.on_consultar},
            {"row": 0, "col": 3, "text": "🔄 DEVOLUCIÓN", "bg": "#f97316", "hover": "#ea580c", "cmd": self.on_devolucion},
            {"row": 0, "col": 4, "text": "🎁 CANJEAR", "bg": "#fb923c", "hover": "#f97316", "cmd": self.on_canjear},
            {"row": 0, "col": 5, "text": "🏷️ DESCUENTO", "bg": "#ec4899", "hover": "#db2777", "cmd": self.on_descuento_item},
            
            # FILA 2
            {"row": 1, "col": 0, "text": "💳 ESTADO CTA", "bg": "#7c3aed", "hover": "#6d28d9", "cmd": self.on_estado_cta},
            {"row": 1, "col": 1, "text": "📜 HISTORIAL", "bg": "#4ade80", "hover": "#22c55e", "cmd": self.on_historial},
            {"row": 1, "col": 2, "text": "📋 LISTA ESPERA", "bg": "#38bdf8", "hover": "#0ea5e9", "cmd": self.on_lista_espera},
            {"row": 1, "col": 3, "text": "📊 REPORTE", "bg": "#ea580c", "hover": "#d97706", "cmd": self.on_reporte},
            {"row": 1, "col": 4, "text": "💸 DESC FACT", "bg": "#fdba74", "hover": "#f97316", "cmd": self.on_descuento_global},
            {"row": 1, "col": 5, "text": "👁️ VISTA PREVIA", "bg": "#f472b6", "hover": "#ec4899", "cmd": self.on_vista_previa},
            
            # FILA 3
            {"row": 2, "col": 0, "text": "🏛️ IMPUESTO", "bg": "#6d28d9", "hover": "#5b21b6", "cmd": self.on_impuesto},
            # Este es el botón dinámico de red que cambia de estado online/offline
            {"row": 2, "col": 1, "text": "🔴 OFFLINE", "bg": "#ef4444", "hover": "#dc2626", "cmd": self.on_status_sync_click, "name": "sync_status"},
            {"row": 2, "col": 2, "text": "💰 CRÉDITO", "bg": "#0891b2", "hover": "#0369a1", "cmd": self.on_credito},
            {"row": 2, "col": 3, "text": "🌟 CLUB VENTA", "bg": "#eab308", "hover": "#ca8a04", "cmd": self.on_club_venta},
            {"row": 2, "col": 4, "text": "🧹 BORRAR FACT", "bg": "#dc2626", "hover": "#b91c1c", "cmd": self.on_borrar_fact},
            {"row": 2, "col": 5, "text": "🚪 SALIR", "bg": "#db2777", "hover": "#be185d", "cmd": self.on_salir}
        ]
        
        self.widgets = {}
        self.render_buttons()

    def render_buttons(self):
        """Dibuja los 18 botones de función con colores y enlaces correspondientes."""
        for cfg in self.buttons_config:
            # Crear botón estándar para poder estilizar el fondo en cualquier OS de manera nativa
            btn = tk.Button(
                self,
                text=cfg["text"],
                bg=cfg["bg"],
                fg=WHITE,
                font=FONT_BTN_KEYS,
                activebackground=cfg["hover"],
                activeforeground=WHITE,
                relief="flat",
                bd=0,
                cursor="hand2",
                command=cfg["cmd"],
                padx=3,
                pady=3
            )
            btn.grid(row=cfg["row"], column=cfg["col"], padx=2, pady=2, sticky="nsew")
            
            # Guardar referencia si tiene nombre (para cambiar estado)
            if "name" in cfg:
                self.widgets[cfg["name"]] = btn
                
            # Efecto hover
            create_hover_effect(btn, cfg["hover"], cfg["bg"])

    def update_sync_status(self, is_online):
        """Actualiza dinámicamente el botón de INTER-ESTADO con el estado actual de red."""
        btn = self.widgets.get("sync_status")
        if not btn:
            return
            
        if is_online:
            btn.configure(text="🟢 ONLINE", bg="#10b981", activebackground="#059669")
            create_hover_effect(btn, "#059669", "#10b981")
        else:
            btn.configure(text="🔴 OFFLINE", bg="#ef4444", activebackground="#dc2626")
            create_hover_effect(btn, "#dc2626", "#ef4444")

    # ==========================================
    # ENLACES DE ACCIÓN
    # ==========================================
    def on_espera(self):
        self.controller.save_cart_to_waiting_list()

    def on_recuperar(self):
        self.controller.recover_cart_from_waiting_list()

    def on_consultar(self):
        self.controller.open_price_lookup()

    def on_devolucion(self):
        self.controller.open_refund_dialog()

    def on_canjear(self):
        self.controller.redeem_customer_points()

    def on_descuento_item(self):
        self.controller.apply_discount_to_selected_item()

    def on_estado_cta(self):
        self.controller.open_customer_account_status()

    def on_historial(self):
        self.controller.open_recent_orders_history()

    def on_lista_espera(self):
        self.controller.recover_cart_from_waiting_list()

    def on_reporte(self):
        self.controller.generate_cash_report()

    def on_descuento_global(self):
        self.controller.apply_global_discount_dialog()

    def on_vista_previa(self):
        self.controller.show_invoice_preview()

    def on_impuesto(self):
        self.controller.configure_taxes_dialog()

    def on_status_sync_click(self):
        """fuerza el testeo de red y sincronización local."""
        self.controller.force_network_ping()

    def on_credito(self):
        self.controller.apply_credit_sale()

    def on_club_venta(self):
        self.controller.toggle_loyalty_club()

    def on_borrar_fact(self):
        self.controller.clear_cart_with_confirmation()

    def on_salir(self):
        self.controller.quit_application()
