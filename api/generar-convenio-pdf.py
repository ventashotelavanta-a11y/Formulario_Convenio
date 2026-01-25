# api/generar-convenio-pdf.py
"""
API Serverless para generar PDFs de convenios - ACTUALIZADO CON PLANTILLA 2026
Coincide exactamente con Plantilla_Convenio_2026.docx
Diseñada para Vercel
"""

from http.server import BaseHTTPRequestHandler
import json
import base64
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from io import BytesIO


def crear_convenio_pdf(numero_convenio, cliente, fecha):
    """
    Crea el PDF del convenio siguiendo exactamente la plantilla 2026
    """
    # Crear buffer en memoria
    buffer = BytesIO()
    
    # Crear canvas
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Colores
    verde_avanta = HexColor('#8BB152')
    gris = HexColor('#666666')
    negro = HexColor('#333333')
    
    y = height - 60  # Posición Y inicial
    
    # ========== LOGO (texto por ahora - se puede cambiar a imagen) ==========
    c.setFillColor(verde_avanta)
    c.setFont('Helvetica-Bold', 24)
    c.drawString(60, y, 'AVANTA')
    
    y -= 20
    c.setFillColor(gris)
    c.setFont('Helvetica', 10)
    c.drawString(60, y, 'Hotel & Villas')
    
    y -= 40
    
    # ========== FECHA ==========
    fecha_obj = datetime.strptime(fecha, '%Y-%m-%d')
    fecha_formateada = fecha_obj.strftime('%d de %B de %Y')
    meses = {
        'January': 'enero', 'February': 'febrero', 'March': 'marzo',
        'April': 'abril', 'May': 'mayo', 'June': 'junio',
        'July': 'julio', 'August': 'agosto', 'September': 'septiembre',
        'October': 'octubre', 'November': 'noviembre', 'December': 'diciembre'
    }
    for en, es in meses.items():
        fecha_formateada = fecha_formateada.replace(en, es)
    
    c.setFillColor(negro)
    c.setFont('Helvetica', 12)
    c.drawString(60, y, f'({fecha_formateada})')
    
    y -= 25
    
    # ========== NOMBRE CLIENTE (en negrita según plantilla) ==========
    nombre_completo = f"{cliente.get('nombre', '')} {cliente.get('apellidos', '')}".strip()
    c.setFont('Helvetica-Bold', 12)
    c.drawString(60, y, nombre_completo)
    
    y -= 20
    
    # ========== TÍTULO ==========
    c.setFont('Helvetica', 12)
    c.drawString(60, y, f"Convenio Avanta con {cliente.get('empresa', 'Empresa')}")
    
    y -= 25
    
    # ========== TEXTO INTRODUCTORIO (2 líneas como en plantilla) ==========
    c.setFont('Helvetica', 12)
    texto_intro_1 = f"A continuación, encontrará las tarifas especiales para su {cliente.get('empresa', 'Empresa')}"
    c.drawString(60, y, texto_intro_1)
    y -= 15
    
    texto_intro_2 = "por parte de Avanta Hotel & Villas"
    c.drawString(60, y, texto_intro_2)
    y -= 30
    
    # ========== TARIFAS SIN DESAYUNO ==========
    c.setFont('Helvetica', 12)  # Título NO está en negrita según plantilla
    c.drawString(60, y, 'Tarifas sin desayuno')
    y -= 18
    
    # Tarifas en negrita
    c.setFont('Helvetica-Bold', 12)
    c.drawString(80, y, 'Habitación Estándar King:      $   940.00   por noche.')
    y -= 18
    c.drawString(80, y, 'Habitación Doble Queen:       $1,120.00   por noche.')
    y -= 25
    
    # ========== TARIFAS CON DESAYUNO (título en negrita según plantilla) ==========
    c.setFont('Helvetica-Bold', 12)
    c.drawString(60, y, 'Tarifas con desayuno Buffet')
    y -= 18
    
    c.setFont('Helvetica-Bold', 12)
    c.drawString(80, y, 'Habitación Estándar King:      $1,130.00     por noche.')
    y -= 18
    c.drawString(80, y, 'Habitación Doble Queen:       $1,670.00     por noche')
    y -= 25
    
    # ========== SERVICIOS ==========
    c.setFont('Helvetica', 12)
    c.drawString(60, y, 'Ofrecemos servicios de:')
    y -= 18
    
    c.setFont('Helvetica', 12)
    c.drawString(80, y, 'Wi-Fi de alta velocidad Gratis')
    y -= 18
    c.drawString(80, y, 'Sala de reuniones y espacio de trabajo para hasta 12 personas.')
    y -= 18
    c.drawString(80, y, 'Estacionamiento gratuito')
    y -= 25
    
    # ========== ESPECIFICACIONES ==========
    c.setFont('Helvetica', 12)
    c.drawString(60, y, 'Especificaciones de tarifas convenio:')
    y -= 18
    
    # Especificación 1
    c.setFont('Helvetica', 12)
    c.drawString(80, y, 'Tarifas por noche por habitación sencilla o doble.')
    y -= 18
    
    # Especificación 2 (en negrita) - ACTUALIZADO según plantilla con punto
    c.setFont('Helvetica-Bold', 12)
    esp2_line1 = 'La tarifa convenio está disponible únicamente para reservaciones realizadas'
    c.drawString(80, y, esp2_line1)
    y -= 15
    
    esp2_line2 = 'directamente con el hotel. a través de nuestro motor de reservaciones con su'
    c.drawString(80, y, esp2_line2)
    y -= 15
    
    esp2_line3 = 'código de reservaciones'
    c.drawString(80, y, esp2_line3)
    y -= 18
    
    # Especificación 3 - ACTUALIZADO según plantilla
    c.setFont('Helvetica', 12)
    esp3_line1 = 'Tarifa vigente al 31 de diciembre de 2026 a partir de ahí el presente convenio'
    c.drawString(80, y, esp3_line1)
    y -= 15
    
    # Continuar con parte normal y parte en negrita
    esp3_line2_start = 'continuará '
    x_pos = 80
    c.drawString(x_pos, y, esp3_line2_start)
    x_pos += c.stringWidth(esp3_line2_start, 'Helvetica', 12)
    
    c.setFont('Helvetica-Bold', 12)
    esp3_line2_bold = '(no tiene vencimiento)'
    c.drawString(x_pos, y, esp3_line2_bold)
    x_pos += c.stringWidth(esp3_line2_bold, 'Helvetica-Bold', 12)
    
    c.setFont('Helvetica', 12)
    esp3_line2_end = ' con las respectivas actualizaciones'
    c.drawString(x_pos, y, esp3_line2_end)
    y -= 15
    
    c.drawString(80, y, 'de tarifa y documento')
    y -= 18
    
    # Especificación 4
    c.drawString(80, y, 'Todas las reservaciones están sujetas a disponibilidad.')
    y -= 30
    
    # ========== DESPEDIDA (corregido el typo de la plantilla) ==========
    c.setFont('Helvetica', 12)
    c.drawString(60, y, 'Agradezco su atención y quedo a la espera de su respuesta.')
    y -= 60
    
    # ========== FIRMAS (formato de la plantilla con tamaño 13pt) ==========
    c.setFont('Helvetica', 13)
    
    # Firma izquierda - Ricardo Peña
    c.drawString(80, y, 'Ricardo Peña Covarrubias')
    
    # Firma derecha - Cliente (alineado aproximadamente como en plantilla)
    c.drawString(380, y, nombre_completo)
    
    y -= 15
    
    # Línea 2 de firmas
    c.drawString(80, y, 'Avanta Hotel & Villas')
    c.drawString(380, y, cliente.get('empresa', 'Empresa'))
    
    # Guardar PDF
    c.save()
    
    # Obtener bytes del buffer
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes


class handler(BaseHTTPRequestHandler):
    """
    Handler principal para Vercel
    """
    
    def set_cors_headers(self):
        """Configurar headers CORS"""
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT')
        self.send_header('Access-Control-Allow-Headers', 
                        'X-CSRF-Token, X-Requested-With, Accept, Content-Type')
    
    def do_OPTIONS(self):
        """Manejar preflight OPTIONS"""
        self.send_response(200)
        self.set_cors_headers()
        self.end_headers()
    
    def do_POST(self):
        """Manejar petición POST"""
        try:
            # Leer cuerpo de la petición
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body)
            
            # Extraer datos
            numero_convenio = data.get('numeroConvenio')
            cliente = data.get('cliente', {})
            fecha = data.get('fecha')
            
            # Validar datos
            if not numero_convenio or not cliente or not fecha:
                raise ValueError("Faltan datos requeridos")
            
            # Crear PDF directamente
            pdf_bytes = crear_convenio_pdf(numero_convenio, cliente, fecha)
            
            # Convertir a base64
            pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
            
            # Crear respuesta
            empresa_normalizada = cliente.get('empresa', 'empresa').replace(' ', '_')
            file_name = f"Convenio_{numero_convenio}_{empresa_normalizada}.pdf"
            
            response = {
                'success': True,
                'message': 'Convenio generado exitosamente - Plantilla 2026 oficial',
                'numeroConvenio': numero_convenio,
                'fileName': file_name,
                'pdfBase64': pdf_base64,
                'cliente': {
                    'nombre': f"{cliente.get('nombre', '')} {cliente.get('apellidos', '')}".strip(),
                    'empresa': cliente.get('empresa'),
                    'email': cliente.get('email')
                }
            }
            
            # Enviar respuesta
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            error_response = {
                'success': False,
                'error': str(e),
                'message': f'Error al generar convenio: {str(e)}'
            }
            
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(error_response).encode('utf-8'))
    
    def do_GET(self):
        """Manejar GET - solo para verificar que la API está activa"""
        response = {
            'status': 'active',
            'version': 'Plantilla 2026 oficial',
            'endpoint': '/api/generar-convenio-pdf'
        }
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.set_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(response).encode('utf-8'))
