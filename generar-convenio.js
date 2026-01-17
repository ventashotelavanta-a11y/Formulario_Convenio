// api-generar-convenio.js
// API para generar PDFs de convenios usando PDFKit

const express = require('express');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

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
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Nombre del archivo
    const fileName = `Convenio_${numeroConvenio}_${cliente.empresaNormalizada}.pdf`;
    const filePath = path.join(__dirname, 'convenios', fileName);

    // Crear directorio si no existe
    if (!fs.existsSync(path.join(__dirname, 'convenios'))) {
      fs.mkdirSync(path.join(__dirname, 'convenios'));
    }

    // Stream para guardar el archivo
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // ========== CONTENIDO DEL PDF ==========
    
    // Logo (si tienes el archivo)
    // doc.image('logo_avanta.png', 50, 45, { width: 100 });

    // Encabezado
    doc.fontSize(24)
       .fillColor('#7FA44A')
       .text('CONVENIO EMPRESARIAL', { align: 'center' })
       .moveDown(0.5);

    doc.fontSize(10)
       .fillColor('#666666')
       .text('Avanta Hotel & Villas', { align: 'center' })
       .moveDown(2);

    // Información del convenio
    doc.fontSize(12)
       .fillColor('#000000')
       .text(`Número de Convenio: ${numeroConvenio}`, { align: 'right' })
       .text(`Fecha: ${fecha}`, { align: 'right' })
       .moveDown(2);

    // Datos de la empresa
    doc.fontSize(14)
       .fillColor('#7FA44A')
       .text('DATOS DE LA EMPRESA', { underline: true })
       .moveDown(0.5);

    doc.fontSize(11)
       .fillColor('#000000')
       .text(`Razón Social: ${cliente.empresa}`)
       .text(`Representante Legal: ${cliente.nombreCompleto}`)
       .text(`Email Corporativo: ${cliente.email}`)
       .text(`Teléfono: ${cliente.telefono}`)
       .moveDown(2);

    // Objeto del convenio
    doc.fontSize(14)
       .fillColor('#7FA44A')
       .text('OBJETO DEL CONVENIO', { underline: true })
       .moveDown(0.5);

    doc.fontSize(11)
       .fillColor('#000000')
       .text('El presente convenio tiene por objeto establecer las condiciones comerciales preferenciales ' +
             'para las reservaciones de hospedaje que realice la empresa y sus colaboradores en Avanta Hotel & Villas.')
       .moveDown(2);

    // Beneficios
    doc.fontSize(14)
       .fillColor('#7FA44A')
       .text('BENEFICIOS Y CONDICIONES', { underline: true })
       .moveDown(0.5);

    const beneficios = [
      'Descuento del 15% en tarifa rack en todas nuestras habitaciones',
      'Late check-out sin costo adicional (sujeto a disponibilidad)',
      'Upgrade de categoría de habitación (sujeto a disponibilidad)',
      'Welcome drink de cortesía para huéspedes corporativos',
      'Acceso preferencial a salas de juntas y espacios de coworking',
      'Estacionamiento sin costo adicional',
      'Wi-Fi de alta velocidad en todas las áreas',
      'Tarifas preferenciales para eventos corporativos'
    ];

    beneficios.forEach((beneficio, index) => {
      doc.fontSize(11)
         .fillColor('#000000')
         .text(`${index + 1}. ${beneficio}`, { indent: 20 })
         .moveDown(0.3);
    });

    doc.moveDown(2);

    // Condiciones generales
    doc.fontSize(14)
       .fillColor('#7FA44A')
       .text('CONDICIONES GENERALES', { underline: true })
       .moveDown(0.5);

    doc.fontSize(11)
       .fillColor('#000000')
       .text('1. Las reservaciones deberán realizarse con al menos 48 horas de anticipación.')
       .text('2. La tarifa corporativa está sujeta a disponibilidad.')
       .text('3. Las cancelaciones deberán notificarse con 24 horas de anticipación.')
       .text('4. Este convenio tiene una vigencia de 12 meses a partir de la fecha de firma.')
       .text('5. Los descuentos no son acumulables con otras promociones.')
       .moveDown(3);

    // Vigencia
    const fechaInicio = new Date(fecha);
    const fechaFin = new Date(fecha);
    fechaFin.setFullYear(fechaFin.getFullYear() + 1);

    doc.fontSize(11)
       .fillColor('#000000')
       .text(`Vigencia: Del ${fechaInicio.toLocaleDateString('es-MX')} al ${fechaFin.toLocaleDateString('es-MX')}`)
       .moveDown(3);

    // Firmas
    doc.fontSize(14)
       .fillColor('#7FA44A')
       .text('FIRMAS', { underline: true })
       .moveDown(2);

    const signatureY = doc.y;

    // Firma empresa
    doc.fontSize(11)
       .fillColor('#000000')
       .text('_________________________', 80, signatureY)
       .text(`${cliente.nombreCompleto}`, 80, signatureY + 20)
       .text(`${cliente.empresa}`, 80, signatureY + 35);

    // Firma Avanta
    doc.text('_________________________', 350, signatureY)
       .text('Ricardo Peña', 350, signatureY + 20)
       .text('Ejecutivo Comercial', 350, signatureY + 35)
       .text('Avanta Hotel & Villas', 350, signatureY + 50);

    // Footer
    doc.fontSize(9)
       .fillColor('#999999')
       .text('Avanta Hotel & Villas | comercial@avantahotel.com.mx', 
             50, 
             doc.page.height - 50, 
             { align: 'center' });

    // Finalizar PDF
    doc.end();

    // Esperar a que se complete la escritura
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Generar URL del archivo (ajusta según tu configuración)
    const pdfUrl = `https://tu-servidor.com/convenios/${fileName}`;

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

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API de convenios escuchando en puerto ${PORT}`);
});

module.exports = app;
