"""Database package initialization and model auto-import for SQLAlchemy metadata discovery."""

import os
import pkgutil
import importlib

package_dir = os.path.dirname(__file__)
for _, module_name, _ in pkgutil.iter_modules([package_dir]):
    if module_name == "models":
        continue
    importlib.import_module(f"{__name__}.{module_name}")
