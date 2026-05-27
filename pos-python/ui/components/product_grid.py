import tkinter as tk
from tkinter import ttk
import os
from PIL import Image, ImageTk
from database.queries import get_all_products, get_all_categories, get_product_by_sku
from ui.styles import BG_CARD, BG_MAIN, CLOUDFLY_BLUE, WHITE, COLOR_SUCCESS, COLOR_WARNING, TEXT_MUTED, FONT_BOLD, FONT_NORMAL, create_hover_effect

class ProductGrid(ttk.Frame):
    def __init__(self, parent, controller):
        super().__init__(parent)
        self.controller = controller
        self.selected_category = "Todos"
        self.product_images = {}
        
        # Padding general del catálogo
        self.configure(padding=10)
        
        # 1. BARRA DE BÚSQUEDA Y FILTRADO (Superior)
        self.search_frame = ttk.Frame(self)
        self.search_frame.pack(fill="x", pady=(0, 10))
        
        # Input de Búsqueda
        self.entry_search = ttk.Entry(self.search_frame, style="TEntry", font=FONT_NORMAL)
        self.entry_search.pack(side="left", fill="x", expand=True, padx=(0, 10))
        self.entry_search.insert(0, "🔍 Buscar por nombre o código de barras...")
        
        # Binds para placeholder y búsqueda
        self.entry_search.bind("<FocusIn>", self.on_search_focus_in)
        self.entry_search.bind("<FocusOut>", self.on_search_focus_out)
        self.entry_search.bind("<KeyRelease>", self.on_search_key_release)
        self.entry_search.bind("<Return>", self.on_search_submit)
        
        # Botón de Búsqueda manual
        self.btn_search = ttk.Button(self.search_frame, text="Escanear/Buscar", style="Primary.TButton", command=self.on_search_submit)
        self.btn_search.pack(side="right")
        
        # 2. BARRA DE CATEGORÍAS
        self.categories_frame = ttk.Frame(self)
        self.categories_frame.pack(fill="x", pady=(0, 10))
        self.render_categories()
        
        # 3. CONTENEDOR GRID SCROLLABLE (Canvas + Scrollbar)
        self.canvas_container = ttk.Frame(self, style="TFrame")
        self.canvas_container.pack(fill="both", expand=True)
        
        self.canvas = tk.Canvas(self.canvas_container, bg=BG_MAIN, highlightthickness=0)
        self.scrollbar = ttk.Scrollbar(self.canvas_container, orient="vertical", command=self.canvas.yview)
        
        self.grid_frame = ttk.Frame(self.canvas, style="TFrame")
        
        # Configurar scroll del canvas
        self.grid_frame_id = self.canvas.create_window((0, 0), window=self.grid_frame, anchor="nw")
        
        self.grid_frame.bind("<Configure>", self.on_frame_configure)
        self.canvas.bind("<Configure>", self.on_canvas_configure)
        
        # Hacer scroll con rueda del ratón
        self.canvas.bind_all("<MouseWheel>", self.on_mousewheel)
        
        self.canvas.configure(yscrollcommand=self.scrollbar.set)
        
        self.canvas.pack(side="left", fill="both", expand=True)
        self.scrollbar.pack(side="right", fill="y")
        
        # Cargar catálogo inicial
        self.refresh_grid()

    def on_search_focus_in(self, e):
        if self.entry_search.get() == "🔍 Buscar por nombre o código de barras...":
            self.entry_search.delete(0, tk.END)

    def on_search_focus_out(self, e):
        if not self.entry_search.get().strip():
            self.entry_search.insert(0, "🔍 Buscar por nombre o código de barras...")

    def on_search_key_release(self, e):
        """Dispara filtrado en vivo en cada tecla (excepto Return)."""
        if e.keysym == "Return":
            return
        query = self.entry_search.get()
        if query == "🔍 Buscar por nombre o código de barras...":
            query = ""
        self.refresh_grid(search_query=query.strip())

    def on_search_submit(self, e=None):
        """Busca una coincidencia exacta por SKU (scanner) o filtra por nombre."""
        query = self.entry_search.get().strip()
        if query == "🔍 Buscar por nombre o código de barras..." or not query:
            return
            
        # Comprobar si es un SKU/código de barras exacto
        prod = get_product_by_sku(query)
        if prod:
            # Encontrado! Agregar al carrito directo
            self.controller.add_product_to_cart(prod, quantity=1)
            # Limpiar buscador
            self.entry_search.delete(0, tk.END)
            self.refresh_grid()
        else:
            # Buscar normal
            self.refresh_grid(search_query=query)

    def render_categories(self):
        """Renderiza dinámicamente los tags de categorías."""
        # Limpiar categorías previas
        for widget in self.categories_frame.winfo_children():
            widget.destroy()
            
        try:
            categories = get_all_categories()
        except:
            categories = ["Todos"]
            
        for i, cat in enumerate(categories):
            # Usar botón especial primario si está seleccionado
            style = "Primary.TButton" if cat == self.selected_category else "TButton"
            btn = ttk.Button(
                self.categories_frame,
                text=cat,
                style=style,
                command=lambda c=cat: self.on_category_select(c)
            )
            btn.pack(side="left", padx=(0, 6), pady=2)

    def on_category_select(self, category):
        """Filtra los productos por la categoría seleccionada."""
        self.selected_category = category
        self.render_categories()
        self.refresh_grid()

    def on_frame_configure(self, e):
        """Ajusta la región de scroll del canvas al tamaño del grid_frame."""
        self.canvas.configure(scrollregion=self.canvas.bbox("all"))

    def on_canvas_configure(self, e):
        """Ajusta el ancho del grid_frame para que ocupe todo el canvas."""
        canvas_width = e.width
        self.canvas.itemconfig(self.grid_frame_id, width=canvas_width)
        self.refresh_grid()  # Recalcula columnas responsivas

    def on_mousewheel(self, e):
        """Permite hacer scroll vertical con la rueda del ratón."""
        # Windows/macOS handling
        if self.canvas.winfo_exists():
            self.canvas.yview_scroll(int(-1 * (e.delta / 120)), "units")

    def refresh_grid(self, search_query=None):
        """Redibuja dinámicamente el catálogo de productos en un grid responsivo."""
        # Limpiar grid previo
        for widget in self.grid_frame.winfo_children():
            widget.destroy()
            
        self.product_images.clear()
        
        try:
            products = get_all_products(category=self.selected_category, search_query=search_query)
        except Exception as e:
            print(f"Error cargando productos: {e}")
            products = []
            
        # Calcular columnas basadas en el ancho del panel catálogo
        canvas_width = self.canvas.winfo_width()
        card_width = 180  # Ancho ideal de cada tarjeta
        num_cols = max(1, canvas_width // card_width)
        
        # Configurar pesos de columnas para alineación uniforme
        for col in range(num_cols):
            self.grid_frame.columnconfigure(col, weight=1)
            
        # Renderizar cada producto como una tarjeta
        for i, prod in enumerate(products):
            row = i // num_cols
            col = i % num_cols
            
            # Crear frame de tarjeta
            card = tk.Frame(self.grid_frame, bg=BG_CARD, highlightbackground=BG_MAIN, highlightthickness=2, cursor="hand2")
            card.grid(row=row, column=col, padx=6, pady=6, sticky="nsew")
            
            # Badge de Tipo (Producto vs Servicio)
            badge_color = CLOUDFLY_BLUE if prod['type'] == 'PRODUCT' else COLOR_WARNING
            badge_text = "PRODUCTO" if prod['type'] == 'PRODUCT' else "SERVICIO"
            
            lbl_badge = tk.Label(card, text=badge_text, bg=badge_color, fg=WHITE, font=("Segoe UI", 8, "bold"), padx=6, pady=2)
            lbl_badge.pack(anchor="ne", padx=8, pady=6)
            
            # --- SECCIÓN DE IMAGEN / PORTADA DE PRODUCTO ---
            root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            local_img_path = os.path.join(root_dir, "cache", "images", f"{prod['backend_id']}.png")
            
            photo_img = None
            if os.path.exists(local_img_path) and os.path.getsize(local_img_path) > 0:
                try:
                    img = Image.open(local_img_path)
                    img = img.resize((160, 100), Image.Resampling.LANCZOS)
                    photo_img = ImageTk.PhotoImage(img)
                    self.product_images[prod['id']] = photo_img
                except Exception as img_err:
                    print(f"Error cargando imagen Pillow para producto {prod['id']}: {img_err}")
            
            if photo_img:
                lbl_img = tk.Label(card, image=photo_img, bg=BG_CARD)
                lbl_img.pack(padx=10, pady=(0, 5))
                lbl_img.bind("<Button-1>", lambda e, p=prod: self.on_card_click(p))
            else:
                # Contenedor de marcador de posición (placeholder) estilizado y moderno
                frame_placeholder = tk.Frame(card, width=160, height=100, bg="#1e293b")
                frame_placeholder.pack_propagate(False)  # Mantener tamaño fijo 160x100
                frame_placeholder.pack(padx=10, pady=(0, 5))
                
                placeholder_char = "📦" if prod['type'] == 'PRODUCT' else "🛠️"
                lbl_placeholder = tk.Label(frame_placeholder, text=placeholder_char, font=("Segoe UI", 28), bg="#1e293b", fg="#475569")
                lbl_placeholder.pack(expand=True, fill="both")
                
                # Enlazar clics al placeholder
                frame_placeholder.bind("<Button-1>", lambda e, p=prod: self.on_card_click(p))
                lbl_placeholder.bind("<Button-1>", lambda e, p=prod: self.on_card_click(p))
            
            # Nombre de Producto
            lbl_name = tk.Label(card, text=prod['name'], bg=BG_CARD, fg=WHITE, font=FONT_BOLD, wraplength=160, justify="center")
            lbl_name.pack(fill="x", padx=10, pady=(5, 5))
            
            # SKU/Categoría secundario
            lbl_sku = tk.Label(card, text=f"SKU: {prod['sku']}", bg=BG_CARD, fg=TEXT_MUTED, font=("Segoe UI", 9))
            lbl_sku.pack(pady=(0, 5))
            
            # Precio
            price_text = f"${prod['sale_price']:.2f}"
            lbl_price = tk.Label(card, text=price_text, bg=BG_CARD, fg=COLOR_SUCCESS, font=("Segoe UI", 12, "bold"))
            lbl_price.pack(pady=5)
            
            # Stock info (si es producto)
            if prod['type'] == 'PRODUCT':
                stock_text = f"Stock: {prod['stock']}"
                stock_color = TEXT_MUTED if prod['stock'] > 10 else COLOR_DANGER
                lbl_stock = tk.Label(card, text=stock_text, bg=BG_CARD, fg=stock_color, font=("Segoe UI", 9, "bold"))
                lbl_stock.pack(pady=(0, 8))
            else:
                dur_text = f"Duración: {prod['duration_mins']}m"
                lbl_dur = tk.Label(card, text=dur_text, bg=BG_CARD, fg=TEXT_MUTED, font=("Segoe UI", 9))
                lbl_dur.pack(pady=(0, 8))
                
            # Asignar evento de clic a toda la tarjeta y sus hijos
            for element in (card, lbl_name, lbl_sku, lbl_price):
                element.bind("<Button-1>", lambda e, p=prod: self.on_card_click(p))
                
            # Hover effect dinámico
            create_hover_effect(card, "#334155", BG_CARD)

    def on_card_click(self, product):
        """Agrega el producto clickeado al carrito a través del controlador."""
        # Convertir diccionario de SQLite a objeto de dominio Product
        from models.product import Product
        prod_obj = Product.from_dict(product)
        self.controller.add_product_to_cart(prod_obj, quantity=1)
