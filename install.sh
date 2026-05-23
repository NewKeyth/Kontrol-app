#!/bin/bash
set -e
echo -e "\033[1;36mKONTROL - Instalador Mágico para Linux\033[0m"

DESKTOP_DIR=$(xdg-user-dir DESKTOP 2>/dev/null || echo "$HOME/Desktop")
ICON_DIR="$HOME/.local/share/icons/kontrol"
BIN_DIR="$HOME/.local/bin"

mkdir -p "$ICON_DIR" "$BIN_DIR" "$DESKTOP_DIR"

# --- CONFIGURACIÓN DE UDEV PARA UINPUT ---
echo "-> Configurando reglas udev para emulación de gamepad sin requerir sudo..."
if [ ! -f /etc/udev/rules.d/85-kontrol-uinput.rules ]; then
    echo "Se solicitarán permisos de administrador (sudo) para crear la regla udev."
    sudo tee /etc/udev/rules.d/85-kontrol-uinput.rules > /dev/null << 'EOF'
KERNEL=="uinput", GROUP="input", MODE="0660", OPTIONS+="static_node=uinput"
EOF
    sudo usermod -aG input "$USER"
    sudo udevadm control --reload-rules && sudo udevadm trigger
    echo -e "\033[1;33m[!] Regla udev instalada. NOTA: Debes cerrar sesión y volver a entrar (o reiniciar) para que tu usuario aplique al grupo 'input' y puedas usar los controles.\033[0m"
else
    echo "Regla udev ya configurada previamente."
fi

echo "-> Descargando Servidor Invisible..."
curl -L -o "$BIN_DIR/KONTROL_Server" "https://github.com/NewKeyth/Kontrol-app/releases/latest/download/KONTROL_Server_Linux"
chmod +x "$BIN_DIR/KONTROL_Server"

echo "-> Descargando Ícono de Alta Resolución..."
curl -sL -o "$ICON_DIR/icon.png" "https://raw.githubusercontent.com/NewKeyth/Kontrol-app/main/mobile_app/assets/icon.png"

echo "-> Generando App en el Escritorio..."
cat << EOF > "$DESKTOP_DIR/KONTROL.desktop"
[Desktop Entry]
Version=1.0
Name=KONTROL
Comment=Servidor Híbrido Gamepad WebSockets
Exec=$BIN_DIR/KONTROL_Server
Terminal=true
Type=Application
Icon=$ICON_DIR/icon.png
Categories=Game;Utility;
EOF

chmod +x "$DESKTOP_DIR/KONTROL.desktop"

# Confiar en la app si estamos en GNOME
if command -v gio &> /dev/null; then
    gio set "$DESKTOP_DIR/KONTROL.desktop" metadata::trusted yes || true
fi

echo -e "\033[1;32m¡Instalación completa! Encontrarás a KONTROL esperándote en tu escritorio.\033[0m"
