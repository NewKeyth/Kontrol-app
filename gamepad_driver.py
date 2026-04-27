"""
UniversalGamepad Layer
Provee una interfaz consistente de latencia-cero para el Mando Virtual.
En Windows usa vgamepad nativo.
En Linux usa evdev (uinput) soportando modos fallback-dummy si faltan dependencias o permisos.
"""

import platform

class WindowsGamepad:
    def __init__(self):
        import vgamepad as vg
        self.gp = vg.VX360Gamepad()
    
    def press_button(self, button_code):
        self.gp.press_button(button_code)
        
    def release_button(self, button_code):
        self.gp.release_button(button_code)
        
    def left_trigger_float(self, value_float):
        self.gp.left_trigger_float(value_float)
        
    def right_trigger_float(self, value_float):
        self.gp.right_trigger_float(value_float)
        
    def left_joystick_float(self, x_value_float, y_value_float):
        self.gp.left_joystick_float(x_value_float, y_value_float)
        
    def right_joystick_float(self, x_value_float, y_value_float):
        self.gp.right_joystick_float(x_value_float, y_value_float)
        
    def update(self):
        self.gp.update()

class LinuxGamepad:
    def __init__(self):
        try:
            from evdev import UInput, ecodes as e, AbsInfo
            cap = {
                e.EV_KEY: [e.BTN_A, e.BTN_B, e.BTN_X, e.BTN_Y, e.BTN_TL, e.BTN_TR, e.BTN_SELECT, e.BTN_START, e.BTN_MODE, e.BTN_THUMBL, e.BTN_THUMBR, e.BTN_DPAD_UP, e.BTN_DPAD_DOWN, e.BTN_DPAD_LEFT, e.BTN_DPAD_RIGHT],
                e.EV_ABS: [
                    (e.ABS_X, AbsInfo(value=0, min=-32768, max=32767, fuzz=16, flat=128, resolution=0)),
                    (e.ABS_Y, AbsInfo(value=0, min=-32768, max=32767, fuzz=16, flat=128, resolution=0)),
                    (e.ABS_RX, AbsInfo(value=0, min=-32768, max=32767, fuzz=16, flat=128, resolution=0)),
                    (e.ABS_RY, AbsInfo(value=0, min=-32768, max=32767, fuzz=16, flat=128, resolution=0)),
                    (e.ABS_Z, AbsInfo(value=0, min=0, max=255, fuzz=0, flat=0, resolution=0)),
                    (e.ABS_RZ, AbsInfo(value=0, min=0, max=255, fuzz=0, flat=0, resolution=0)),
                ]
            }
            self.e = e
            self.ui = UInput(cap, name="Microsoft X-Box 360 pad (Universal)", vendor=0x045e, product=0x028e, version=0x0114)
            self.dummy = False
            print("UniversalGamepad: Evdev (Linux) Virtual Gamepad Creado Ok.")
        except Exception as err:
            print(f"UniversalGamepad Advertencia: Evdev falló ({err}). Modo Dummy Linux activado.")
            self.dummy = True
    
    def press_button(self, button_code):
        if not self.dummy: self.ui.write(self.e.EV_KEY, button_code, 1)
            
    def release_button(self, button_code):
        if not self.dummy: self.ui.write(self.e.EV_KEY, button_code, 0)
            
    def left_trigger_float(self, value_float):
        if not self.dummy: self.ui.write(self.e.EV_ABS, self.e.ABS_Z, int(value_float * 255))
            
    def right_trigger_float(self, value_float):
        if not self.dummy: self.ui.write(self.e.EV_ABS, self.e.ABS_RZ, int(value_float * 255))
            
    def left_joystick_float(self, x_value_float, y_value_float):
        if not self.dummy:
            self.ui.write(self.e.EV_ABS, self.e.ABS_X, int(x_value_float * 32767))
            self.ui.write(self.e.EV_ABS, self.e.ABS_Y, int(y_value_float * 32767))
            
    def right_joystick_float(self, x_value_float, y_value_float):
        if not self.dummy:
            self.ui.write(self.e.EV_ABS, self.e.ABS_RX, int(x_value_float * 32767))
            self.ui.write(self.e.EV_ABS, self.e.ABS_RY, int(y_value_float * 32767))
            
    def update(self):
        if not self.dummy: self.ui.syn()

# =========================================================
# ASIGNACION ESTATICA O(1) (EVALUADA EN CADA REINICIO, NO EN RUNTIME)
# =========================================================

system = platform.system()

if system == "Windows":
    import vgamepad as vg
    UniversalGamepad = WindowsGamepad
    
    BUTTONS = {
        "A": vg.XUSB_BUTTON.XUSB_GAMEPAD_A,
        "B": vg.XUSB_BUTTON.XUSB_GAMEPAD_B,
        "X": vg.XUSB_BUTTON.XUSB_GAMEPAD_X,
        "Y": vg.XUSB_BUTTON.XUSB_GAMEPAD_Y,
        "LB": vg.XUSB_BUTTON.XUSB_GAMEPAD_LEFT_SHOULDER,
        "RB": vg.XUSB_BUTTON.XUSB_GAMEPAD_RIGHT_SHOULDER,
        "MENU": vg.XUSB_BUTTON.XUSB_GAMEPAD_START,
        "APPS": vg.XUSB_BUTTON.XUSB_GAMEPAD_BACK,
        "UP": vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_UP,
        "DOWN": vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_DOWN,
        "LEFT": vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_LEFT,
        "RIGHT": vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_RIGHT,
    }
else:
    try:
        from evdev import ecodes as e
        BUTTONS = {
            "A": e.BTN_A,
            "B": e.BTN_B,
            "X": e.BTN_X,
            "Y": e.BTN_Y,
            "LB": e.BTN_TL,
            "RB": e.BTN_TR,
            "MENU": e.BTN_START,
            "APPS": e.BTN_SELECT,
            "UP": e.BTN_DPAD_UP,
            "DOWN": e.BTN_DPAD_DOWN,
            "LEFT": e.BTN_DPAD_LEFT,
            "RIGHT": e.BTN_DPAD_RIGHT,
        }
    except ImportError:
        BUTTONS = {k: k for k in ["A", "B", "X", "Y", "LB", "RB", "MENU", "APPS", "UP", "DOWN", "LEFT", "RIGHT"]}
    UniversalGamepad = LinuxGamepad

def get_button_action(action_str):
    """Convierte un string 'A_PRESIONADO' a su codigo hex nativo + flag booleano"""
    if action_str.endswith("_PRESIONADO"):
        btn = action_str.replace("_PRESIONADO", "")
        return BUTTONS.get(btn), True
    elif action_str.endswith("_SOLTADO"):
        btn = action_str.replace("_SOLTADO", "")
        return BUTTONS.get(btn), False
    return None, None
