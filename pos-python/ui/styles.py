import tkinter as tk
from tkinter import ttk

# ==========================================
# PALETA DE COLORES (Inspirada en el Logo de CloudFly)
# ==========================================
CLOUDFLY_BLUE = "#0082f4"       # Azul vibrante del logo
CLOUDFLY_BLUE_HOVER = "#006ecf" # Azul más oscuro para hover
BG_MAIN = "#0f172a"             # Slate 900 (Fondo principal)
BG_CARD = "#1e293b"             # Slate 800 (Fondo de tarjetas/secciones)
BG_BORDER = "#334155"           # Slate 700 (Bordes finos)
TEXT_PRIMARY = "#f8fafc"        # Slate 50 (Texto principal)
TEXT_MUTED = "#94a3b8"          # Slate 400 (Subtítulos, etiquetas)
WHITE = "#ffffff"               # Blanco puro (Parte del logo)

# Colores de estado
COLOR_SUCCESS = "#10b981"       # Emerald (Cobro, estado ok)
COLOR_SUCCESS_HOVER = "#059669"
COLOR_DANGER = "#ef4444"        # Rose (Acción borrar, cancelar, salir)
COLOR_DANGER_HOVER = "#dc2626"
COLOR_WARNING = "#f59e0b"       # Amber (Acciones de alerta, espera)
COLOR_WARNING_HOVER = "#d97706"

# ==========================================
# FUENTES
# ==========================================
FONT_FAMILY = "Segoe UI"
FONT_TITLE_LARGE = (FONT_FAMILY, 24, "bold")
FONT_TITLE_SECTION = (FONT_FAMILY, 16, "bold")
FONT_NORMAL = (FONT_FAMILY, 11, "normal")
FONT_BOLD = (FONT_FAMILY, 11, "bold")
FONT_TOTAL = (FONT_FAMILY, 24, "bold")
FONT_CAR_ITEM = (FONT_FAMILY, 10, "normal")

def apply_styles(root):
    """Aplica el tema Slate Premium con colores del logo de CloudFly a toda la aplicación."""
    style = ttk.Style(root)
    
    # IMPORTANTE: Forzar el uso del tema 'clam' para permitir personalización completa de botones y tablas en Windows
    style.theme_use("clam")
    
    # ------------------------------------------
    # ESTILOS GENERALES
    # ------------------------------------------
    # Fondo de ventana principal
    style.configure(".",
        background=BG_MAIN,
        foreground=TEXT_PRIMARY,
        font=FONT_NORMAL,
        troughcolor=BG_CARD,
        bordercolor=BG_BORDER,
        darkcolor=BG_MAIN,
        lightcolor=BG_MAIN
    )
    
    # ------------------------------------------
    # FRAMES
    # ------------------------------------------
    style.configure("TFrame", background=BG_MAIN)
    style.configure("Card.TFrame", background=BG_CARD, borderwidth=1, relief="solid")
    
    # ------------------------------------------
    # LABELS
    # ------------------------------------------
    style.configure("TLabel", background=BG_MAIN, foreground=TEXT_PRIMARY)
    style.configure("Card.TLabel", background=BG_CARD, foreground=TEXT_PRIMARY)
    style.configure("Muted.TLabel", background=BG_MAIN, foreground=TEXT_MUTED)
    style.configure("CardMuted.TLabel", background=BG_CARD, foreground=TEXT_MUTED)
    
    style.configure("Title.TLabel", background=BG_MAIN, foreground=WHITE, font=FONT_TITLE_LARGE)
    style.configure("Section.TLabel", background=BG_CARD, foreground=WHITE, font=FONT_TITLE_SECTION)
    
    # Total prominente
    style.configure("Total.TLabel", background=BG_CARD, foreground=COLOR_SUCCESS, font=FONT_TOTAL)
    
    # ------------------------------------------
    # ENTRADAS DE TEXTO (TEntry)
    # ------------------------------------------
    style.configure("TEntry",
        fieldbackground=BG_CARD,
        foreground=WHITE,
        background=BG_CARD,
        bordercolor=BG_BORDER,
        lightcolor=BG_BORDER,
        darkcolor=BG_BORDER,
        insertcolor=WHITE,  # Color del cursor
        padding=8
    )
    # Cambiar cursor de entrada a blanco para legibilidad en tema oscuro
    root.option_add("*TEntry.insertColor", WHITE)
    
    # ------------------------------------------
    # BOTONES TTK (TButton)
    # ------------------------------------------
    # Configuración base
    style.configure("TButton",
        background=BG_BORDER,
        foreground=TEXT_PRIMARY,
        bordercolor=BG_BORDER,
        darkcolor=BG_BORDER,
        lightcolor=BG_BORDER,
        font=FONT_BOLD,
        padding=(8, 4),
        anchor="center"
    )
    style.map("TButton",
        background=[("active", BG_CARD), ("pressed", BG_MAIN)],
        foreground=[("active", WHITE)]
    )
    
    # Botón Primario (CloudFly Blue)
    style.configure("Primary.TButton",
        background=CLOUDFLY_BLUE,
        foreground=WHITE,
        bordercolor=CLOUDFLY_BLUE,
        darkcolor=CLOUDFLY_BLUE,
        lightcolor=CLOUDFLY_BLUE
    )
    style.map("Primary.TButton",
        background=[("active", CLOUDFLY_BLUE_HOVER), ("pressed", CLOUDFLY_BLUE_HOVER)],
        foreground=[("active", WHITE)]
    )
    
    # Botón Success (Emerald)
    style.configure("Success.TButton",
        background=COLOR_SUCCESS,
        foreground=WHITE,
        bordercolor=COLOR_SUCCESS,
        darkcolor=COLOR_SUCCESS,
        lightcolor=COLOR_SUCCESS
    )
    style.map("Success.TButton",
        background=[("active", COLOR_SUCCESS_HOVER), ("pressed", COLOR_SUCCESS_HOVER)],
        foreground=[("active", WHITE)]
    )
    
    # Botón Danger (Rose)
    style.configure("Danger.TButton",
        background=COLOR_DANGER,
        foreground=WHITE,
        bordercolor=COLOR_DANGER,
        darkcolor=COLOR_DANGER,
        lightcolor=COLOR_DANGER
    )
    style.map("Danger.TButton",
        background=[("active", COLOR_DANGER_HOVER), ("pressed", COLOR_DANGER_HOVER)],
        foreground=[("active", WHITE)]
    )

    # Botón Warning (Amber)
    style.configure("Warning.TButton",
        background=COLOR_WARNING,
        foreground=WHITE,
        bordercolor=COLOR_WARNING,
        darkcolor=COLOR_WARNING,
        lightcolor=COLOR_WARNING
    )
    style.map("Warning.TButton",
        background=[("active", COLOR_WARNING_HOVER), ("pressed", COLOR_WARNING_HOVER)],
        foreground=[("active", WHITE)]
    )
    
    # ------------------------------------------
    # TABLA TREEVIEW (Carrito de compras)
    # ------------------------------------------
    style.configure("Treeview",
        background=BG_CARD,
        fieldbackground=BG_CARD,
        foreground=TEXT_PRIMARY,
        bordercolor=BG_BORDER,
        font=FONT_CAR_ITEM,
        rowheight=32
    )
    style.configure("Treeview.Heading",
        background=BG_BORDER,
        foreground=WHITE,
        font=FONT_BOLD,
        bordercolor=BG_BORDER,
        padding=6
    )
    style.map("Treeview",
        background=[("selected", CLOUDFLY_BLUE)],
        foreground=[("selected", WHITE)]
    )
    
    # ------------------------------------------
    # SCROLLBARS
    # ------------------------------------------
    style.configure("Vertical.TScrollbar",
        background=BG_BORDER,
        troughcolor=BG_MAIN,
        bordercolor=BG_BORDER,
        arrowcolor=WHITE
    )
    style.map("Vertical.TScrollbar",
        background=[("active", BG_CARD), ("pressed", CLOUDFLY_BLUE)]
    )

def create_hover_effect(widget, active_bg, normal_bg):
    """Asigna eventos de mouse hover tradicionales para widgets que no usan TTK directamente."""
    def on_enter(e):
        widget.configure(background=active_bg)
    def on_leave(e):
        widget.configure(background=normal_bg)
    widget.bind("<Enter>", on_enter)
    widget.bind("<Leave>", on_leave)
