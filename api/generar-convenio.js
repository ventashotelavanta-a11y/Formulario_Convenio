// api/generar-convenio.js
// API Serverless para generar PDFs de convenios usando PDFKit - Formato Avanta
// Diseñada para Vercel

const PDFDocument = require('pdfkit');

// Función para generar el PDF en memoria y devolverlo como base64
async function generarPDFConvenio(numeroConvenio, cliente, fecha) {
  return new Promise((resolve, reject) => {
    try {
      // Crear documento PDF
      const doc = new PDFDocument({ 
        size: 'LETTER',
        margins: { top: 60, bottom: 60, left: 60, right: 60 }
      });

      // Buffer para almacenar el PDF en memoria
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // ========== CONTENIDO DEL PDF - FORMATO AVANTA ==========
      
      // Espacio para logo (sin imagen, solo texto por ahora)
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .fillColor('#8BB152')
         .text('AVANTA', 60, 60)
         .fontSize(10)
         .fillColor('#666')
         .text('Hotel & Villas', 60, 85);
      
      doc.moveDown(3);

      // Fecha (alineada a la derecha)
      const fechaFormateada = new Date(fecha).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.fontSize(10)
         .fillColor('#333')
         .text(`(${fechaFormateada})`, { align: 'right' });
      
      doc.moveDown(1.5);

      // Encabezado - Lic. (Nombre) (Apellidos)
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text(`Lic. ${cliente.nombreCompleto || cliente.nombre + ' ' + cliente.apellidos}`);
      
      doc.moveDown(1);

      // Texto inicial
      doc.fontSize(11)
         .font('Helvetica')
         .text(`Es un placer para mí ponerme en contacto con usted para presentarle las tarifas especiales para su empresa (${cliente.empresa}) por parte de Avanta Hotel & Villas`, {
           align: 'justify'
         });
      
      doc.moveDown(1.5);

      // Dirección
      doc.fontSize(10)
         .text('Estamos ubicados en Carretera Querétaro - San Luis Potosí 23800, Santa Rosa Jáuregui, Querétaro, CP 76220', {
           align: 'justify'
         });
      
      doc.moveDown(2);

      // Tarifas sin desayuno
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('Tarifas sin desayuno');
      
      doc.moveDown(0.5);

      // Lista de tarifas sin desayuno
      doc.fontSize(10)
         .font('Helvetica')
         .list([
           'Habitación Estándar King:     $940.00  por noche.',
           'Habitación Doble Queen:       $1,120.00 por noche.'
         ], { bulletRadius: 2 });
      
      doc.moveDown(1);

      // Tarifas con desayuno
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('Tarifas con desayuno Buffet');
      
      doc.moveDown(0.5);

      // Lista de tarifas con desayuno
      doc.fontSize(10)
         .font('Helvetica')
         .list([
           'Habitación Estándar King:     $1,230.00  por noche.',
           'Habitación Doble Queen:       $1,699.00   por noche'
         ], { bulletRadius: 2 });
      
      doc.moveDown(1.5);

      // Servicios que ofrecemos
      doc.fontSize(10)
         .text('Algunos de los servicios que ofrecemos son:');
      
      doc.moveDown(0.5);

      doc.list([
        'Wi-Fi de alta velocidad.',
        'Sala de reuniones y espacio de trabajo para hasta 12 personas.',
        'Estacionamiento gratuito'
      ], { bulletRadius: 2 });
      
      doc.moveDown(2);

      // Especificaciones de tarifas convenio
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('Especificaciones de tarifas convenio:');
      
      doc.moveDown(1);

      doc.fontSize(10)
         .font('Helvetica');

      // Primera especificación
      doc.list([
        'Tarifas por noche por habitación sencilla o doble.'
      ], { bulletRadius: 2 });
      
      doc.moveDown(0.5);

      // Segunda especificación (texto en negrita)
      doc.font('Helvetica-Bold')
         .text('•  La tarifa convenio está disponible únicamente para reservaciones realizadas directamente con el hotel, a través de nuestro motor de reservaciones con su código de reservaciones', {
           indent: 20
         });
      
      doc.moveDown(0.5);

      doc.font('Helvetica');

      // Resto de especificaciones
      const especificaciones = [
        `Tarifa vigente al 31 de diciembre de 2026 a partir de ahí el presente convenio continuará (no tiene vencimiento) con las respectivas actualizaciones de tarifa y documento`,
        'Todas las reservaciones están sujetas a disponibilidad.'
      ];

      especificaciones.forEach(esp => {
        doc.text(`•  ${esp}`, {
          indent: 20,
          align: 'justify'
        });
        doc.moveDown(0.5);
      });

      doc.moveDown(1);

      // Nota final
      doc.fontSize(10)
         .font('Helvetica')
         .text('Es importante señalar que, dependiendo del número de noches que las empresas requieran, existe la posibilidad de establecer convenios especiales.', {
           align: 'justify'
         });
      
      doc.moveDown(3);

      // Despedida
      doc.fontSize(10)
         .text('Agradezco su atención y quedo a la espera de su respuesta.', {
           align: 'justify'
         });
      
      doc.moveDown(3);

      // Firmas - dos columnas
      const firmaY = doc.y;
      const leftX = 80;
      const rightX = 350;

      // Firma izquierda - Ricardo Peña
      doc.fontSize(11)
         .font('Helvetica')
         .text('Ricardo Peña Covarrubias', leftX, firmaY, { width: 200 })
         .text('Avanta Hotel & Villas', leftX, firmaY + 20, { width: 200 });

      // Firma derecha - Cliente
      doc.text('Nombre Apellidos', rightX, firmaY, { width: 200 })
         .text('Empresa', rightX, firmaY + 20, { width: 200 });

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
    const fileName = `Convenio_${numeroConvenio}_${cliente.empresaNormalizada || cliente.empresa}.pdf`;

    // Responder con el PDF en base64
    return res.status(200).json({
      success: true,
      message: 'Convenio generado exitosamente',
      numeroConvenio: numeroConvenio,
      fileName: fileName,
      pdfBase64: pdfBase64,
      cliente: {
        nombre: cliente.nombreCompleto || `${cliente.nombre} ${cliente.apellidos}`,
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
