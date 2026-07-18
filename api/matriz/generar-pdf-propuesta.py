"""Genera un PDF de la propuesta de aumento de tarifas (actual vs. propuesta)."""
from http.server import BaseHTTPRequestHandler
import json, os, base64
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

VERDE = HexColor('#7FA44A')
GRIS = HexColor('#888888')
NEGRO = HexColor('#333333')


def registrar_fuente(dir_api):
    try:
        pdfmetrics.registerFont(TTFont('Kodchasan', os.path.join(dir_api, '..', '..', 'Kodchasan-Medium.ttf')))
        return 'Kodchasan'
    except Exception:
        return 'Helvetica'


def fmt(v):
    return 'N/A' if v is None else f"${v:,.2f}"


def crear_pdf(anio, tarifas):
    dir_api = os.path.dirname(os.path.abspath(__file__))
    fuente = registrar_fuente(dir_api)
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 60

    c.setFont(fuente, 18)
    c.setFillColor(NEGRO)
    c.drawString(50, y, f"Propuesta de aumento de tarifas — {anio}")
    y -= 30

    for tarifa in tarifas:
        persona_extra = tarifa.get('personaExtra', [])
        # Altura real que ocupa este módulo: título + header + una línea por
        # valor (incluyendo las filas de persona extra, que se dibujan con el
        # mismo alto de línea más abajo) + el espacio final, usando los mismos
        # incrementos que el dibujado de abajo (16 / 14 / 13 por fila / 10 de cierre).
        altura_modulo = 16 + 14 + (len(tarifa['valores']) + len(persona_extra)) * 13 + 10
        if y - altura_modulo < 60:
            c.showPage()
            y = height - 60
        c.setFont(fuente, 12)
        c.setFillColor(VERDE)
        c.drawString(50, y, tarifa['nombre'])
        y -= 16

        c.setFont(fuente, 9)
        c.setFillColor(GRIS)
        c.drawString(60, y, 'Tipo de habitación')
        c.drawString(220, y, 'Pax')
        c.drawString(260, y, 'Actual')
        c.drawString(330, y, 'Propuesta')
        y -= 14

        for valor in tarifa['valores']:
            c.setFillColor(NEGRO)
            c.drawString(60, y, valor['tipoHabitacion'])
            c.drawString(220, y, str(valor['pax']))
            c.drawString(260, y, fmt(valor.get('montoActual')))
            c.drawString(330, y, fmt(valor.get('montoPropuesto')))
            y -= 13

        for extra in persona_extra:
            c.setFillColor(NEGRO)
            c.drawString(60, y, f"Persona extra — {extra['tipoHabitacion']}")
            c.drawString(220, y, '—')
            c.drawString(260, y, fmt(extra.get('montoActual')))
            c.drawString(330, y, fmt(extra.get('montoPropuesto')))
            y -= 13
        y -= 10

    c.save()
    return buffer.getvalue()


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            datos = json.loads(self.rfile.read(length))
            pdf_bytes = crear_pdf(datos.get('anio'), datos.get('tarifas', []))
            resp = {'success': True, 'pdfBase64': base64.b64encode(pdf_bytes).decode('utf-8')}
            self.send_response(200)
            self._cors()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(resp).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self._cors()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode('utf-8'))

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def log_message(self, format, *args):
        pass
