# -*- mode: python ; coding: utf-8 -*-
# cloudfly_pos.spec — Especificación de empaquetado PyInstaller para CloudFly POS

block_cipher = None

a = Analysis(
    ['main.py'],
    pathex=['.'],
    binaries=[],
    datas=[
        # Incluir carpetas de código fuente como datos (para imports relativos)
        ('database', 'database'),
        ('models', 'models'),
        ('network', 'network'),
        ('ui', 'ui'),
        # Carpeta cache/images vacía (se llenará en runtime por la sincronización)
        ('cache', 'cache'),
    ],
    hiddenimports=[
        'tkinter',
        'tkinter.ttk',
        'tkinter.messagebox',
        'PIL',
        'PIL.Image',
        'PIL.ImageTk',
        'requests',
        'sqlite3',
        'json',
        'threading',
        'database.connection',
        'database.queries',
        'models.cart',
        'models.customer',
        'models.order',
        'models.product',
        'network.api_client',
        'network.sync_service',
        'ui.main_window',
        'ui.styles',
        'ui.components.cart_panel',
        'ui.components.function_keys',
        'ui.components.header',
        'ui.components.modals',
        'ui.components.product_grid',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'matplotlib',
        'numpy',
        'scipy',
        'pandas',
        'pytest',
        'unittest',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='CloudFlyPOS',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,          # Sin consola negra visible al usuario
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='assets/icon.ico', # Ícono de la aplicación
    version_file=None,
)
