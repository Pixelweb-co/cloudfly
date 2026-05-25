# Wrapper package to expose marketing_agent models
import importlib.util, sys, os

# Dynamically load submodules from marketing_agent/models
base_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'marketing_agent', 'models'))
if os.path.isdir(base_dir):
    for filename in os.listdir(base_dir):
        if filename.endswith('.py') and filename != '__init__.py':
            module_name = filename[:-3]
            spec = importlib.util.spec_from_file_location(f'models.{module_name}', os.path.join(base_dir, filename))
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            sys.modules[f'models.{module_name}'] = module
