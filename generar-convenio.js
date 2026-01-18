// api-generar-convenio.js
// API para generar PDFs de convenios usando PDFKit - Formato Avanta

const express = require('express');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(require('cors')());

// Endpoint para generar convenio
app.post('/generar-convenio', async (req, res) => {
  try {
    const { numeroConvenio, cliente, fecha } = req.body;

    // Validar datos requeridos
    if (!numeroConvenio || !cliente || !fecha) {
      return res.status(400).json({ 
        error: 'Faltan datos requeridos',
        required: ['numeroConvenio', 'cliente', 'fecha']
      });
    }

    // Crear documento PDF
    const doc = new PDFDocument({ 
      size: 'LETTER',
      margins: { top: 60, bottom: 60, left: 60, right: 60 }
    });

    // Nombre del archivo
    const fileName = `Convenio_${numeroConvenio}_${cliente.empresaNormalizada || cliente.empresa}.pdf`;
    const filePath = path.join(__dirname, 'convenios', fileName);

    // Crear directorio si no existe
    if (!fs.existsSync(path.join(__dirname, 'convenios'))) {
      fs.mkdirSync(path.join(__dirname, 'convenios'));
    }

    // Stream para guardar el archivo
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // ========== CONTENIDO DEL PDF - FORMATO AVANTA ==========
    
    // Logo Avanta (si existe el archivo)
    const logoPath = path.join(__dirname, 'logo_avanta_principal.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 60, 60, { width: 120 });
    }

    // Espacio después del logo
    doc.moveDown(4);

    // Fecha (alineada a la derecha)
    const fechaFormateada = new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.fontSize(10)
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
       .text('Tarifas sin desayuno');
    
    doc.moveDown(0.5);

    // Lista de tarifas sin desayuno
    doc.fontSize(10)
       .list([
         'Habitación Estándar King:     $940.00  por noche.',
         'Habitación Doble Queen:       $1,120.00 por noche.'
       ], { bulletRadius: 2 });
    
    doc.moveDown(1);

    // Tarifas con desayuno
    doc.fontSize(11)
       .text('Tarifas con desayuno Buffet');
    
    doc.moveDown(0.5);

    // Lista de tarifas con desayuno
    doc.fontSize(10)
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
       .text('•  La tarifa convenio está disponible únicamente para reservaciones realizadas directamente con el hotel. a través de nuestro motor de reservaciones con su código de reservaciones', {
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
       .text('Agradezco su atención y quedo o la espero de su respuesta.', {
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

    // Footer decorativo (patrón de chevrons verdes)
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 50;
    
    // Dibujar patrón de chevrons (opcional - requiere más trabajo para ser exacto)
    // Por ahora dejamos espacio para el footer
    doc.moveDown(4);

    // Finalizar PDF
    doc.end();

    // Esperar a que se complete la escritura
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Generar URL del archivo (ajusta según tu configuración)
    const pdfUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/convenios/${fileName}`;

    // Responder con la información del PDF
    res.json({
      success: true,
      message: 'Convenio generado exitosamente',
      numeroConvenio: numeroConvenio,
      fileName: fileName,
      filePath: filePath,
      pdfUrl: pdfUrl,
      cliente: cliente
    });

  } catch (error) {
    console.error('Error generando convenio:', error);
    res.status(500).json({
      error: 'Error al generar el convenio',
      message: error.message
    });
  }
});

// Endpoint para servir PDFs generados
app.get('/convenios/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'convenios', req.params.filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Archivo no encontrado' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API de convenios funcionando correctamente' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ API de convenios Avanta escuchando en puerto ${PORT}`);
  console.log(`📄 Endpoint: http://localhost:${PORT}/generar-convenio`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
