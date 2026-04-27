#!/bin/bash
set -e
echo -e "\033[1;36mKONTROL - Instalador Mágico para Linux\033[0m"

DESKTOP_DIR=$(xdg-user-dir DESKTOP 2>/dev/null || echo "$HOME/Desktop")
ICON_DIR="$HOME/.local/share/icons/kontrol"
BIN_DIR="$HOME/.local/bin"

mkdir -p "$ICON_DIR" "$BIN_DIR" "$DESKTOP_DIR"

echo "-> Descargando Servidor Invisible..."
curl -L -o "$BIN_DIR/KONTROL_Server" "https://github.com/NewKeyth/Kontrol-app/releases/latest/download/KONTROL_Server_Linux"
chmod +x "$BIN_DIR/KONTROL_Server"

echo "-> Descargando Ícono de Alta Resolución..."
curl -sL -o "$ICON_DIR/icon.png" "https://raw.githubusercontent.com/NewKeyth/Kontrol-app/main/mobile_app/assets/icon.png"

echo "-> Generando App en el Escritorio..."
cat << 'EOF' > "$DESKTOP_DIR/KONTROL.desktop"
[Desktop Entry]
Version=1.0
Name=KONTROL
Comment=Servidor Híbrido Gamepad WebSockets
Exec=sh -c "sudo ~/.local/bin/KONTROL_Server"
Terminal=true
Type=Application
Icon=__ICON_PATH__
Categories=Game;Utility;
EOF

sed -i "s|__ICON_PATH__|$ICON_DIR/icon.png|g" "$DESKTOP_DIR/KONTROL.desktop"
chmod +x "$DESKTOP_DIR/KONTROL.desktop"

# Confiar en la app si estamos en GNOME
if command -v gio &> /dev/null; then
    gio set "$DESKTOP_DIR/KONTROL.desktop" metadata::trusted yes || true
fi

echo -e "\033[1;32m¡Instalación completa! Encontrarás a KONTROL esperándote en tu escritorio.\033[0m"
