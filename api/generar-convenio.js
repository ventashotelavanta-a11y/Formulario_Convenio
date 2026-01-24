// api/generar-convenio.js
// API Serverless para generar PDFs de convenios usando PDFKit - Formato Avanta 2026 ACTUALIZADO
// Diseñada para Vercel

const PDFDocument = require('pdfkit');
const https = require('https');

// Función para descargar imagen desde URL
function descargarImagen(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

// Función para generar el PDF en memoria y devolverlo como base64
async function generarPDFConvenio(numeroConvenio, cliente, fecha) {
  return new Promise(async (resolve, reject) => {
    try {
      // URL del logo en GitHub
      const logoUrl = 'https://raw.githubusercontent.com/ventashotelavanta-a11y/Formulario_Convenio/main/formulario/logo_avanta_principal.png';
      
      // Descargar logo
      let logoBuffer;
      try {
        logoBuffer = await descargarImagen(logoUrl);
      } catch (error) {
        console.warn('No se pudo cargar el logo:', error.message);
        logoBuffer = null;
      }

      // Crear documento PDF con márgenes ajustados
      const doc = new PDFDocument({ 
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 60, right: 60 }
      });

      // Buffer para almacenar el PDF en memoria
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // ========== CONTENIDO DEL PDF - FORMATO AVANTA 2026 ACTUALIZADO ==========
      
      // Logo (si se pudo descargar)
      if (logoBuffer) {
        doc.image(logoBuffer, 60, 40, { width: 120 });
      } else {
        // Fallback a texto si no hay logo
        doc.fontSize(18)
           .font('Helvetica-Bold')
           .fillColor('#8BB152')
           .text('AVANTA', 60, 40)
           .fontSize(9)
           .fillColor('#666')
           .text('Hotel & Villas', 60, 62);
      }
      
      doc.moveDown(2.5);

      // Fecha (formato entre paréntesis)
      const fechaFormateada = new Date(fecha).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.fontSize(10)
         .fillColor('#333')
         .text(`(${fechaFormateada})`, 60, doc.y);
      
      doc.moveDown(1.5);

      // Nombre y Apellidos del cliente
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text(`${cliente.nombre || ''} ${cliente.apellidos || ''}`.trim());
      
      doc.moveDown(0.8);

      // Convenio Avanta con (Empresa)
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text(`Convenio Avanta con ${cliente.empresa || 'Empresa'}`);
      
      doc.moveDown(1.2);

      // Texto introductorio - FORMATO 2026
      doc.fontSize(10.5)
         .font('Helvetica')
         .text(`A continuación, encontrará las tarifas especiales para su ${cliente.empresa || 'Empresa'} por parte de Avanta Hotel & Villas`, {
           align: 'left'
         });
      
      doc.moveDown(1.5);

      // ========== TARIFAS SIN DESAYUNO ==========
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('Tarifas sin desayuno');
      
      doc.moveDown(0.5);

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .list([
           'Habitación Estándar King: $940.00 por noche.',
           'Habitación Doble Queen: $1,120.00 por noche.'
         ], { bulletRadius: 1.5 });
      
      doc.moveDown(1);

      // ========== TARIFAS CON DESAYUNO - PRECIOS ACTUALIZADOS 2026 ==========
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('Tarifas con desayuno Buffet');
      
      doc.moveDown(0.5);

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .list([
           'Habitación Estándar King: $1,130.00 por noche.',
           'Habitación Doble Queen: $1,670.00 por noche'
         ], { bulletRadius: 1.5 });
      
      doc.moveDown(1.2);

      // ========== SERVICIOS ==========
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('Ofrecemos servicios de:');
      
      doc.moveDown(0.5);

      doc.fontSize(10)
         .font('Helvetica')
         .list([
           'Wi-Fi de alta velocidad Gratis',
           'Sala de reuniones y espacio de trabajo para hasta 12 personas.',
           'Estacionamiento gratuito'
         ], { bulletRadius: 1.5 });
      
      doc.moveDown(1.5);

      // ========== ESPECIFICACIONES ==========
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('Especificaciones de tarifas convenio:');
      
      doc.moveDown(0.6);

      doc.fontSize(10)
         .font('Helvetica');

      // Primera especificación
      doc.text('•  Tarifas por noche por habitación sencilla o doble.', {
        indent: 0
      });
      
      doc.moveDown(0.4);

      // Segunda especificación (en negrita) - FORMATO 2026
      doc.font('Helvetica-Bold')
         .text('•  La tarifa convenio está disponible únicamente para reservaciones realizadas directamente con el hotel, a través de nuestro motor de reservaciones con su código de reservaciones', {
           indent: 0,
           align: 'left'
         });
      
      doc.moveDown(0.4);

      doc.font('Helvetica');

      // Tercera especificación - FORMATO 2026
      doc.text('•  Tarifa vigente al 31 de diciembre de 2026 a partir de ahí el presente convenio continuará ', {
        indent: 0,
        continued: true
      });
      doc.font('Helvetica-Bold')
         .text('(no tiene vencimiento)', { continued: true });
      doc.font('Helvetica')
         .text(' con las respectivas actualizaciones de tarifa y documento');
      
      doc.moveDown(0.4);

      // Cuarta especificación
      doc.text('•  Todas las reservaciones están sujetas a disponibilidad.', {
        indent: 0
      });

      doc.moveDown(2);

      // Despedida - FORMATO 2026
      doc.fontSize(10)
         .font('Helvetica')
         .text('Agradezco su atención y quedo a la espera de su respuesta.');
      
      doc.moveDown(3);

      // ========== FIRMAS - DOS COLUMNAS ==========
      const firmaY = doc.y;
      const leftX = 80;
      const rightX = 350;

      // Firma izquierda - Ricardo Peña
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('Ricardo Peña Covarrubias', leftX, firmaY, { width: 180 });
      
      doc.fontSize(10)
         .font('Helvetica')
         .text('Avanta Hotel & Villas', leftX, firmaY + 15, { width: 180 });

      // Firma derecha - Cliente
      const nombreCompleto = `${cliente.nombre || ''} ${cliente.apellidos || ''}`.trim();
      
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text(nombreCompleto || 'Nombre Apellidos', rightX, firmaY, { width: 180 });
      
      doc.fontSize(10)
         .font('Helvetica')
         .text(cliente.empresa || 'Empresa', rightX, firmaY + 15, { width: 180 });

      // Finalizar PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

// Handler principal para Vercel
module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo aceptar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Método no permitido',
      message: 'Solo se acepta POST'
    });
  }

  try {
    const { numeroConvenio, cliente, fecha } = req.body;

    // Validar datos requeridos
    if (!numeroConvenio || !cliente || !fecha) {
      return res.status(400).json({ 
        error: 'Faltan datos requeridos',
        required: ['numeroConvenio', 'cliente', 'fecha'],
        received: { numeroConvenio, cliente: !!cliente, fecha }
      });
    }

    // Generar PDF
    const pdfBuffer = await generarPDFConvenio(numeroConvenio, cliente, fecha);

    // Convertir a base64
    const pdfBase64 = pdfBuffer.toString('base64');

    // Nombre del archivo
    const empresaNormalizada = (cliente.empresa || 'empresa').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Convenio_${numeroConvenio}_${empresaNormalizada}.pdf`;

    // Responder con el PDF en base64
    return res.status(200).json({
      success: true,
      message: 'Convenio generado exitosamente - Formato 2026',
      numeroConvenio: numeroConvenio,
      fileName: fileName,
      pdfBase64: pdfBase64,
      cliente: {
        nombre: `${cliente.nombre || ''} ${cliente.apellidos || ''}`.trim(),
        empresa: cliente.empresa,
        email: cliente.email
      }
    });

  } catch (error) {
    console.error('Error generando convenio:', error);
    return res.status(500).json({
      error: 'Error al generar el convenio',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
