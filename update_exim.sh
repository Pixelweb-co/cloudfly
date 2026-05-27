# Script para actualizar whitelist y ratelimit en Exim (HestiaCP)
# Evitemos el duplicado y prioricemos el whitelist

# 1. Asegurar que la IP esté en el archivo de whitelist
IP="109.205.182.94"
FILE="/etc/exim4/white-blocks.conf"
if ! grep -q "$IP" "$FILE"; then
    echo "$IP" >> "$FILE"
    echo "✅ IP $IP añadida a $FILE"
fi

# 2. Modificar la plantilla para que el whitelist sea el PRIMER paso en acl_check_spammers
TEMPLATE="/etc/exim4/exim4.conf.template"

# Verificamos si ya está inyectado para evitar duplicados infinitos
if ! grep -q "accept  hosts         = +whitelist" /etc/exim4/exim4.conf.template | head -n 1 | grep -q "accept"; then
    # Usamos perl para insertar de forma segura
    perl -pi -e 's/acl_check_spammers:/acl_check_spammers:\n  accept  hosts         = +whitelist/' $TEMPLATE
    echo "✅ Regla de whitelist priorizada en $TEMPLATE"
fi

# 3. Eliminar la regla de whitelist que estaba más abajo (opcional pero limpio)
# Lo hacemos solo si hay más de una ocurrencia
OCCURRENCES=$(grep -c "accept  hosts         = +whitelist" $TEMPLATE)
if [ "$OCCURRENCES" -gt 1 ]; then
    # Eliminamos la última instancia
    sed -i "$ s/  accept  hosts         = +whitelist//" $TEMPLATE
    echo "✅ Limpieza de regla duplicada completada."
fi

# 4. Reiniciar Exim
systemctl restart exim4
echo "🚀 Exim reiniciado con éxito."
