{
  "name": "api-convenios-avanta",
  "version": "1.0.0",
  "description": "API para generar PDFs de convenios Avanta Hotel & Villas",
  "main": "api/generar-convenio.js",
  "scripts": {
    "dev": "vercel dev",
    "deploy": "vercel --prod"
  },
  "keywords": [
    "pdf",
    "convenios",
    "avanta",
    "hotel"
  ],
  "author": "Avanta Hotel & Villas",
  "license": "MIT",
  "dependencies": {
    "pdfkit": "^0.15.0",
    "cors": "^2.8.5"
  },
  "engines": {
    "node": ">=18.x"
  }
}
