import sys
import os

# Asegurar que el directorio pos-python esté en el path de importación
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ui.main_window import MainWindow

def main():
    try:
        # Instanciar y arrancar el orquestador principal
        app = MainWindow()
        app.mainloop()
    except Exception as e:
        print(f"Error crítico de inicialización de la app: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
