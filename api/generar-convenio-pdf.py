# api/generar-convenio-pdf.py
"""
API Serverless para generar PDFs de convenios - CON TARIFAS DINÁMICAS
Plantilla 2026 - VERSIÓN FINAL CORREGIDA
Diseñada para Vercel
"""

from http.server import BaseHTTPRequestHandler
import json
import base64
import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from io import BytesIO


def crear_convenio_pdf(numero_convenio, cliente, fecha, tarifas=None, año_vigencia=None):
    """
    Crea el PDF del convenio siguiendo exactamente la plantilla 2026
    Ahora acepta tarifas dinámicas
    """
    # Tarifas por defecto si no se proporcionan
    if tarifas is None:
        tarifas = {
            'kingSin': 800,
            'queenSin': 1000,
            'kingCon': 1040,
            'queenCon': 1480
        }
    
    # Año de vigencia por defecto
    if año_vigencia is None:
        año_vigencia = str(datetime.now().year + 1)
    
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
    
    # ========== LOGO ==========
    try:
        # Cargar el logo (JPG con fondo blanco, PNG como fallback)
        logo_path = os.path.join(os.path.dirname(__file__), 'logo_avanta_principal.jpg')
        if not os.path.exists(logo_path):
            logo_path = os.path.join(os.path.dirname(__file__), 'logo_avanta_principal.png')
        
        logo = ImageReader(logo_path)
        
        # Dibujar el logo
        c.drawImage(logo, 60, y - 20, width=150, height=60, preserveAspectRatio=True, mask='auto')
        
        y -= 70  # Ajustar posición Y después del logo
        
    except Exception as e:
        # Si falla cargar el logo, usar texto como respaldo
        c.setFillColor(verde_avanta)
        c.setFont('Helvetica-Bold', 24)
        c.drawString(60, y, 'AVANTA')
        y -= 20
        c.setFillColor(gris)
        c.setFont('Helvetica', 10)
        c.drawString(60, y, 'Hotel & Villas')
        y -= 40
    
    # ========== FECHA (alineada a la derecha, SIN paréntesis) ==========
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
    # Fecha a la derecha SIN paréntesis
    fecha_ancho = c.stringWidth(fecha_formateada, 'Helvetica', 12)
    c.drawString(width - 60 - fecha_ancho, y, fecha_formateada)
    
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
    
    # ========== TEXTO INTRODUCTORIO (sin "su" antes de empresa) ==========
    c.setFont('Helvetica', 12)
    texto_intro_1 = f"A continuación, encontrará las tarifas especiales para {cliente.get('empresa', 'Empresa')}"
    c.drawString(60, y, texto_intro_1)
    y -= 15
    
    texto_intro_2 = "        por parte de Avanta Hotel & Villas"
    c.drawString(60, y, texto_intro_2)
    y -= 30
    
    # ========== TARIFAS SIN DESAYUNO (sin paréntesis) ==========
    c.setFont('Helvetica', 12)  # Título NO está en negrita según plantilla
    c.drawString(60, y, 'Tarifas sin desayuno')
    y -= 21
    
    # Formatear tarifas con comas - SIN paréntesis
    king_sin_fmt = f"${tarifas['kingSin']:,.2f}".replace(',', '_').replace('.', ',').replace('_', '.')
    queen_sin_fmt = f"${tarifas['queenSin']:,.2f}".replace(',', '_').replace('.', ',').replace('_', '.')
    
    # Habitación SENCILLA King (sin desayuno) - ESPACIOS AJUSTADOS
    c.setFont('Helvetica-Bold', 12)
    c.drawString(80, y, f'Habitación Sencilla  King:     {king_sin_fmt}  por noche')
    y -= 15
    
    # Número de personas
    c.setFont('Helvetica', 12)
    c.drawString(80, y, 'Para 1 o 2 personas')
    y -= 15
    
    c.setFont('Helvetica-Bold', 12)
    c.drawString(80, y, f'Habitación Doble Queen:     {queen_sin_fmt}  por noche')
    y -= 16
    
    c.setFont('Helvetica', 12)
    c.drawString(80, y, 'Para 2 personas')
    y -= 23
    
    # ========== TARIFAS CON DESAYUNO (sin paréntesis) ==========
    c.setFont('Helvetica', 12)  # NO en negrita
    c.drawString(60, y, 'Tarifas con desayuno Buffet')
    y -= 20
    
    king_con_fmt = f"${tarifas['kingCon']:,.2f}".replace(',', '_').replace('.', ',').replace('_', '.')
    queen_con_fmt = f"${tarifas['queenCon']:,.2f}".replace(',', '_').replace('.', ',').replace('_', '.')
    
    # Habitación SENCILLA King (con desayuno) - ESPACIOS AJUSTADOS
    c.setFont('Helvetica-Bold', 12)
    c.drawString(80, y, f'Habitación Sencilla King:      {king_con_fmt}  por noche')
    y -= 15
    
    # "Para 1 persona" SIN negrita (corregido)
    c.setFont('Helvetica', 12)
    c.drawString(80, y, ' Para 1 persona')
    y -= 15
    
    c.setFont('Helvetica-Bold', 12)
    c.drawString(80, y, f'Habitación Doble Queen:     {queen_con_fmt}  por noche')
    y -= 16
    
    c.setFont('Helvetica', 12)
    c.drawString(80, y, 'Para 2 personas')
    y -= 23
    
    # ========== SERVICIOS ==========
    c.setFont('Helvetica', 12)
    c.drawString(60, y, 'Ofrecemos servicios de:')
    y -= 23
    
    c.setFont('Helvetica', 12)
    c.drawString(80, y, 'Wi-Fi de alta velocidad Gratis')
    y -= 15
    c.drawString(80, y, 'Sala de reuniones y espacio de trabajo para hasta 12 personas.')
    y -= 15
    c.drawString(80, y, 'Estacionamiento gratuito')
    y -= 26
    
    # ========== ESPECIFICACIONES ==========
    c.setFont('Helvetica', 12)
    c.drawString(60, y, 'Especificaciones de tarifas convenio:')
    y -= 22
    
    # Especificación completa en negrita (según plantilla línea 25)
    c.setFont('Helvetica-Bold', 12)
    c.drawString(80, y, 'La tarifa convenio está disponible únicamente para reservaciones realizadas')
    y -= 15
    c.drawString(80, y, 'directamente con el hotel. a través de nuestro motor de reservaciones con el')
    y -= 15
    # código de Promocional: AVANTA
    c.drawString(80, y, 'código de Promocional: AVANTA')
    y -= 15
    
    # Año SIN paréntesis
    c.setFont('Helvetica', 12)
    c.drawString(80, y, f'Tarifa vigente al 31 de diciembre de {año_vigencia} a partir de ahí el presente convenio')
    y -= 15
    
    # Continuar con parte normal y parte en negrita
    x_pos = 80
    c.drawString(x_pos, y, 'continuará ')
    x_pos += c.stringWidth('continuará ', 'Helvetica', 12)
    
    c.setFont('Helvetica-Bold', 12)
    c.drawString(x_pos, y, '(no tiene vencimiento) ')
    x_pos += c.stringWidth('(no tiene vencimiento) ', 'Helvetica-Bold', 12)
    
    c.setFont('Helvetica', 12)
    c.drawString(x_pos, y, 'con las respectivas actualizaciones')
    y -= 15
    
    c.drawString(80, y, 'de tarifa y documento')
    y -= 15
    
    c.drawString(80, y, 'Todas las reservaciones están sujetas a disponibilidad.')
    y -= 30
    
    # ========== DESPEDIDA ==========
    c.setFont('Helvetica', 12)
    c.drawString(60, y, 'Agradezco su atención y quedo o la espero de su respuesta.')
    y -= 60
    
    # ========== FIRMAS (formato de la plantilla con tamaño 13pt) ==========
    c.setFont('Helvetica', 13)
    
    # Firma izquierda - Ricardo Peña
    c.drawString(80, y, 'Ricardo Peña Covarrubias')
    
    # Firma derecha - Cliente
    c.drawString(380, y, nombre_completo)
    
    y -= 15
    
    # Línea 2 de firmas
    c.drawString(80, y, 'Avanta Hotel & Villas')
    c.drawString(380, y, cliente.get('empresa', 'Empresa'))
    
    # ========== PIE DE PÁGINA (JPG con fondo blanco) ==========
    try:
        # Cargar la imagen del pie de página (JPG preferido, PNG como fallback)
        pie_path = os.path.join(os.path.dirname(__file__), 'pie_de_pagina.jpg')
        if not os.path.exists(pie_path):
            pie_path = os.path.join(os.path.dirname(__file__), 'pie_de_pagina.png')
        
        pie_imagen = ImageReader(pie_path)
        
        # Dibujar el pie de página en la parte inferior
        pie_height = 30  # Altura del pie de página
        c.drawImage(pie_imagen, 0, 0, width=width, height=pie_height, preserveAspectRatio=False, mask='auto')
        
    except Exception as e:
        # Si falla cargar la imagen del pie, continuar sin ella
        print(f"Advertencia: No se pudo cargar pie_de_pagina: {e}")
    
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
            tarifas = data.get('tarifas')
            año_vigencia = data.get('añoVigencia')
            
            # Validar datos
            if not numero_convenio or not cliente or not fecha:
                raise ValueError("Faltan datos requeridos")
            
            # Crear PDF con tarifas dinámicas
            pdf_bytes = crear_convenio_pdf(
                numero_convenio, 
                cliente, 
                fecha, 
                tarifas=tarifas,
                año_vigencia=año_vigencia
            )
            
            # Convertir a base64
            pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
            
            # Crear respuesta
            empresa_normalizada = cliente.get('empresa', 'empresa').replace(' ', '_')
            file_name = f"Convenio_{numero_convenio}_{empresa_normalizada}.pdf"
            
            response = {
                'success': True,
                'message': 'Convenio generado exitosamente - Plantilla 2026',
                'numeroConvenio': numero_convenio,
                'fileName': file_name,
                'pdfBase64': pdf_base64,
                'cliente': {
                    'nombre': f"{cliente.get('nombre', '')} {cliente.get('apellidos', '')}".strip(),
                    'empresa': cliente.get('empresa'),
                    'email': cliente.get('email')
                },
                'tarifas': tarifas,
                'añoVigencia': año_vigencia
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
            'version': 'Plantilla 2026 FINAL',
            'endpoint': '/api/generar-convenio-pdf'
        }
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.set_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(response).encode('utf-8'))
