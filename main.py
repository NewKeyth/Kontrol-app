"""
KONTROL SERVER - WEB EDITION (Sin dependencias externas UI)
-----------------------------------------------------------
Backend de Python usando el motor vgamepad puro.
Sirve la UI Web en http://localhost:8080 mediante librerías nativas de Python.
La UI (HTML/JS) se comunica mediante un WebSocket de Admin en puerto 5006.
"""

import os
import sys
import asyncio
import threading
import json
import socket
import http.server
import socketserver
from datetime import datetime

try:
    import websockets
    from websockets.protocol import State
    from gamepad_driver import UniversalGamepad, get_button_action
except ImportError:
    print("Error: Faltan dependencias. Ejecuta: pip install websockets evdev (en Linux) o vgamepad (en Windows)")
    sys.exit(1)

# --- WEB SERVER (Sirve HTML/CSS/JS) ---
def start_web_server():
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    
    web_dir = os.path.join(base_path, "desktop_ui")
    os.chdir(web_dir)
    
    Handler = http.server.SimpleHTTPRequestHandler
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("0.0.0.0", 8080), Handler) as httpd:
        print("Servidor UI Web iniciado en http://localhost:8080")
        httpd.serve_forever()

# --- ADMIN WEBSOCKET PARA INTERFAZ ---
class AdminServer:
    def __init__(self, main_server):
        self.main_server = main_server
        self.clients = set()
    
    async def handler(self, websocket):
        self.clients.add(websocket)
        try:
            # Enviar estado inicial
            await websocket.send(json.dumps({
                "type": "state", "val": "running" if self.main_server.is_running else "stopped"
            }))
            await websocket.send(json.dumps({
                "type": "ip", "val": get_local_ip()
            }))
            await websocket.send(json.dumps({
                "type": "log", "val": "Monitor de Servidor KONTROL conectado exitosamente."
            }))
            
            # Recuperar jugadores
            for pid, status in self.main_server.slots.items():
                if status is not None:
                    await websocket.send(json.dumps({"type": "player", "id": pid, "status": "online"}))
            
            async for message in websocket:
                data = json.loads(message)
                if data["cmd"] == "toggle":
                    if self.main_server.is_running:
                        self.main_server.stop()
                    else:
                        self.main_server.start()
        except Exception:
            pass
        finally:
            if websocket in self.clients:
                self.clients.remove(websocket)

    async def broadcast(self, data):
        for ws in list(self.clients):
            if ws.protocol.state == State.OPEN:
                try: await ws.send(json.dumps(data))
                except: pass

ADMIN = None

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

# --- MOTOR DE GAMEPADS (Igual al original) ---
class ServerRunner:
    def __init__(self, port):
        self.port = port
        self.slots = {1: None, 2: None, 3: None, 4: None}
        self.gamepads = {1: None, 2: None, 3: None, 4: None}
        self.all_clients = set()
        self.loop = None
        self.server_thread = None
        self.is_running = False
        self.app_active = True
        self.gamepad_server_obj = None

    def on_log(self, msg):
        if ADMIN and getattr(self, 'loop', None):
            try: asyncio.run_coroutine_threadsafe(ADMIN.broadcast({"type": "log", "val": msg}), self.loop)
            except: pass
        else: print(msg)

    def on_state_change(self, state):
        if ADMIN and getattr(self, 'loop', None):
            try: asyncio.run_coroutine_threadsafe(ADMIN.broadcast({"type": "state", "val": state}), self.loop)
            except: pass

    def on_player_connect(self, pid, ip):
        if ADMIN and getattr(self, 'loop', None):
            try: asyncio.run_coroutine_threadsafe(ADMIN.broadcast({"type": "player", "id": pid, "status": "online"}), self.loop)
            except: pass
        self.on_log(f"P{pid} conectado desde {ip}")

    def on_player_disconnect(self, pid):
        if ADMIN and getattr(self, 'loop', None):
            try: asyncio.run_coroutine_threadsafe(ADMIN.broadcast({"type": "player", "id": pid, "status": "offline"}), self.loop)
            except: pass
        self.on_log(f"P{pid} desconectado.")

    def boot(self):
        self.server_thread = threading.Thread(target=self._run_event_loop, daemon=True)
        self.server_thread.start()

    def start(self):
        if not self.is_running and self.loop:
            self.is_running = True
            asyncio.run_coroutine_threadsafe(self._start_gamepad_async(), self.loop)

    def stop(self):
        if self.is_running and self.loop:
            self.is_running = False
            self.on_log("Servidor Gamepad detenido. Desconectando jugadores...")
            asyncio.run_coroutine_threadsafe(self._stop_gamepad_async(), self.loop)

    def _run_event_loop(self):
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        self.loop.run_until_complete(self._admin_server())

    async def _admin_server(self):
        global ADMIN
        ADMIN = AdminServer(self)
        try:
            async with websockets.serve(ADMIN.handler, "0.0.0.0", 5006):
                # Despues de arrancar admin, arrancamos el de gamepad automaticamente
                self.start()
                while self.app_active:
                    await asyncio.sleep(1)
        except Exception as e:
            self.on_log(f"Error crítico Admin WS: {e}")

    async def _start_gamepad_async(self):
        self.on_state_change("running")
        self.on_log(f"Recibiendo mandos en puerto {self.port}...")
        try:
            self.gamepad_server_obj = await websockets.serve(self._handler, "0.0.0.0", self.port)
        except Exception as e:
            self.on_log(f"Error Gamepad WS: {e}")

    async def _stop_gamepad_async(self):
        self.on_state_change("stopped")
        if self.gamepad_server_obj:
            self.gamepad_server_obj.close()
            await self.gamepad_server_obj.wait_closed()
            self.gamepad_server_obj = None
        
        # Desconectar jugadores forzosamente
        for ws in list(self.all_clients):
            await ws.close()
        self.all_clients.clear()
        
        for k in self.slots.keys():
            if self.slots[k]:
                self.slots[k] = None
                self.gamepads[k] = None
                self.on_player_disconnect(k)

    async def _handler(self, websocket):
        self.all_clients.add(websocket)
        player_id = None
        try:
            await self._broadcast_players()
            async for message in websocket:
                if not self.is_running:
                    break
                parts = message.split('|')
                
                # Protocolo Registro
                if parts[0] == "REGISTER":
                    requested_id = int(parts[1])
                    if requested_id in self.slots and self.slots[requested_id] is None:
                        player_id = requested_id
                        self.slots[player_id] = websocket
                        try:
                            self.gamepads[player_id] = UniversalGamepad()
                            self.on_player_connect(player_id, websocket.remote_address[0])
                            await websocket.send(f"REGISTER_OK|{player_id}")
                            await self._broadcast_players()
                        except Exception as e:
                            self.on_log(f"Error ViGEm: {e}")
                            await websocket.send(f"REGISTER_ERROR|{requested_id}|VIGEM_ERROR")
                    else:
                        await websocket.send(f"REGISTER_ERROR|{requested_id}|IN_USE")
                
                # Protocolo Input
                elif player_id and parts[0] == str(player_id):
                    self._process_input(player_id, parts[1], parts[2:] if len(parts) > 2 else [])
                
                elif parts[0] == "GET_PLAYERS":
                    await self._broadcast_players()
                    
        except websockets.ConnectionClosed:
            pass
        finally:
            if websocket in self.all_clients:
                self.all_clients.remove(websocket)
            if player_id:
                self.slots[player_id] = None
                self.gamepads[player_id] = None
                self.on_player_disconnect(player_id)
                await self._broadcast_players()

    async def _broadcast_players(self):
        occupied = [str(k) for k, v in self.slots.items() if v is not None]
        msg = f"PLAYERS_LIST|{','.join(occupied)}"
        for ws in list(self.all_clients):
            if ws.protocol.state == State.OPEN:
                try: await ws.send(msg)
                except: pass

    def _process_input(self, pid, action, params):
        gp = self.gamepads[pid]
        if not gp: return
        
        try:
            btn_code, is_pressed = get_button_action(action)
            if btn_code is not None:
                if is_pressed: gp.press_button(btn_code)
                else: gp.release_button(btn_code)
            elif action == "RT_ANA": gp.right_trigger_float(float(params[0]))
            elif action == "LT_ANA": gp.left_trigger_float(float(params[0]))
            elif action == "JOY_IZQUIERDO": gp.left_joystick_float(float(params[0]), -float(params[1]))
            elif action == "JOY_DERECHO": gp.right_joystick_float(float(params[0]), -float(params[1]))
            gp.update()
        except:
            pass

if __name__ == '__main__':
    print("Iniciando infraestructura de Servidor Web (0 dependencias externas)...")
    
    runner = ServerRunner(port=5005)
    runner.boot()
    
    # Hilo para servir HTML
    t = threading.Thread(target=start_web_server, daemon=True)
    t.start()
    
    print("\n--------------------------------------------------------------")
    print(">>> SERVIDOR ACTIVO. ABRIENDO TU NAVEGADOR AUTOMÁTICAMENTE...")
    print("--------------------------------------------------------------\n")
    
    import webbrowser
    threading.Timer(1.5, lambda: webbrowser.open('http://localhost:8080')).start()
    
    try:
        while True:
            import time
            time.sleep(1)
    except KeyboardInterrupt:
        print("Cerrando...")
