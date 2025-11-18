import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Charger les variables d'environnement
dotenv.config();

const app = express();
const port = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Initialiser Prisma
const prisma = new PrismaClient();

// Routes API pour les catégories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { id, name, slug } = req.body;

    let category;
    if (id) {
      // Mise à jour d'une catégorie existante
      category = await prisma.category.update({
        where: { id },
        data: { name, slug },
      });
    } else {
      // Création d'une nouvelle catégorie
      category = await prisma.category.create({
        data: { name, slug },
      });
    }

    res.json(category);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la catégorie:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de la catégorie:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes API pour les produits
app.get('/api/products', async (req, res) => {
  try {
    const { category } = req.query;
    let products;

    if (category) {
      products = await prisma.product.findMany({
        where: { categoryId: category },
        include: { category: true },
      });
    } else {
      products = await prisma.product.findMany({
        include: { category: true },
      });
    }

    res.json(products);
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { id, name, description, price, image, category, stock_quantity } = req.body;

    let product;
    if (id) {
      // Mise à jour d'un produit existant
      product = await prisma.product.update({
        where: { id },
        data: {
          name,
          description,
          price: parseFloat(price),
          imageUrl: image,
          categoryId: category,
          stockQuantity: parseInt(stock_quantity) || 0,
          updatedAt: new Date(),
        },
        include: { category: true },
      });
    } else {
      // Création d'un nouveau produit
      product = await prisma.product.create({
        data: {
          name,
          description,
          price: parseFloat(price),
          imageUrl: image,
          categoryId: category,
          stockQuantity: parseInt(stock_quantity) || 0,
        },
        include: { category: true },
      });
    }

    res.json(product);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du produit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes API pour vérifier les tables
app.get('/api/health/tables', async (req, res) => {
  try {
    const tables = [
      'categories', 'products', 'stock_movements', 'stock_alerts',
      'orders', 'order_items', 'site_content', 'invoices',
      'invoice_items', 'quotes', 'quote_items', 'services'
    ];

    const results = {};

    for (const table of tables) {
      try {
        let count = 0;
        switch (table) {
          case 'categories':
            count = await prisma.category.count();
            break;
          case 'products':
            count = await prisma.product.count();
            break;
          case 'stock_movements':
            count = await prisma.stockMovement.count();
            break;
          case 'stock_alerts':
            count = await prisma.stockAlert.count();
            break;
          case 'orders':
            count = await prisma.order.count();
            break;
          case 'order_items':
            count = await prisma.orderItem.count();
            break;
          case 'site_content':
            count = await prisma.siteContent.count();
            break;
          case 'invoices':
            count = await prisma.invoice.count();
            break;
          case 'invoice_items':
            count = await prisma.invoiceItem.count();
            break;
          case 'quotes':
            count = await prisma.quote.count();
            break;
          case 'quote_items':
            count = await prisma.quoteItem.count();
            break;
          case 'services':
            count = await prisma.service.count();
            break;
        }
        results[table] = { exists: true, count };
      } catch (error) {
        results[table] = { exists: false, error: error.message };
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Erreur lors de la vérification des tables:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes API pour le contenu du site
app.get('/api/site-content', async (req, res) => {
  try {
    const siteContent = await prisma.siteContent.findMany();
    res.json({ items: siteContent });
  } catch (error) {
    console.error('Erreur lors de la récupération du contenu du site:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/site-content', async (req, res) => {
  try {
    const { section, field, value } = req.body;

    const siteContent = await prisma.siteContent.upsert({
      where: {
        section_field: {
          section,
          field,
        },
      },
      update: { value, updatedAt: new Date() },
      create: { section, field, value },
    });

    res.json(siteContent);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du contenu du site:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour mettre à jour plusieurs éléments de contenu en batch
app.post('/api/site-content/batch', async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items doit être un tableau' });
    }

    const results = [];

    for (const item of items) {
      const { section, field, value } = item;

      const siteContent = await prisma.siteContent.upsert({
        where: {
          section_field: {
            section,
            field,
          },
        },
        update: { value, updatedAt: new Date() },
        create: { section, field, value },
      });

      results.push(siteContent);
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde en batch du contenu du site:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Configuration multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'ImagesSite');
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique pour éviter les conflits
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const basename = path.basename(file.originalname, extension);
    cb(null, `${basename}-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Vérifier que c'est une image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  }
});

// Route pour uploader des images
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucune image fournie' });
    }

    // Retourner le chemin relatif de l'image
    const imagePath = `/ImagesSite/${req.file.filename}`;
    res.json({
      success: true,
      imageUrl: imagePath,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload d\'image:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload' });
  }
});

// Route pour supprimer une image
app.delete('/api/upload/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'ImagesSite', filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'Image supprimée' });
    } else {
      res.status(404).json({ error: 'Image non trouvée' });
    }
  } catch (error) {
    console.error('Erreur lors de la suppression d\'image:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// Servir les images statiques
app.use('/ImagesSite', express.static(path.join(process.cwd(), 'ImagesSite')));

// Route pour envoyer des messages WhatsApp
app.post('/api/send-whatsapp', async (req, res) => {
  try {
    const { orderData, message, phone } = req.body;
    console.log('Données reçues pour WhatsApp:', JSON.stringify(req.body, null, 2));

    // Configuration CallMeBot
    const CALLMEBOT_PHONE = '221770299821';
    const CALLMEBOT_APIKEY = '7255012';
    const CALLMEBOT_BASE_URL = 'https://api.callmebot.com/whatsapp.php';

    let finalMessage = '';
    let targetPhone = CALLMEBOT_PHONE; // Par défaut, envoi au numéro configuré

    if (orderData) {
      // Formatage automatique pour une commande
      const order = orderData;
      
      try {
        const itemsText = order.products
          .map(
            (product) =>
              `• ${product.name}\n   Qté: ${product.quantity} | Prix: ${product.price.toLocaleString()} FCFA | Total: ${product.subtotal.toLocaleString()} FCFA`,
          )
          .join('\n');

        const notesText = order.notes ? `\n📝 Notes:\n${order.notes}` : '';

        finalMessage = `
🏢 *KB&S - COMMANDE ${order.orderNumber}*

👤 *Client:* ${order.customerName}
📧 *Email:* ${order.customerEmail || 'Non spécifié'}
📞 *Téléphone:* ${order.customerPhone}
📍 *Adresse:* ${order.customerAddress}
🚚 *Mode de livraison:* ${order.deliveryMode}
📅 *Date:* ${new Date().toLocaleDateString('fr-FR')}
🕒 *Heure:* ${new Date().toLocaleTimeString('fr-FR')}

🛍️ *Produits commandés:*
${itemsText}

💰 *TOTAL: ${order.total.toLocaleString()} FCFA*${notesText}

📞 Contact: +221 77 029 98 21
✉️ Email: kewekane@yahoo.fr

Merci de votre confiance !
`.trim();
      } catch (formatError) {
        console.error('Erreur lors du formatage du message:', formatError);
        finalMessage = `Nouvelle commande de ${order.customerName} - Total: ${order.total} FCFA`;
      }
    } else if (message && phone) {
      // Message direct
      finalMessage = message;
      targetPhone = phone;
    } else {
      return res.status(400).json({
        error: 'Données manquantes. Fournissez soit orderData soit message + phone'
      });
    }

    // Normalisation du numéro
    const cleanPhone = targetPhone.replace(/\s+/g, '').replace(/^\+/, '');
    const encodedMessage = encodeURIComponent(finalMessage);

    // Construction de l'URL CallMeBot
    const url = `${CALLMEBOT_BASE_URL}?phone=${cleanPhone}&text=${encodedMessage}&apikey=${CALLMEBOT_APIKEY}`;

    console.log('Envoi WhatsApp CallMeBot vers:', cleanPhone);
    console.log('URL de la requête:', url);

    // Appel à l'API CallMeBot
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'KB&S-Server/1.0'
      }
    });

    const responseText = await response.text();
    console.log('Réponse CallMeBot:', responseText);

    // Analyse de la réponse
    const lowerResponse = responseText.toLowerCase();
    const successIndicators = ['success', 'sent', 'message sent', 'ok', 'delivered', 'queued', 'message queued'];

    const isSuccess = successIndicators.some(indicator => lowerResponse.includes(indicator));

    if (isSuccess) {
      console.log('Message WhatsApp envoyé avec succès');
      res.json({
        success: true,
        message: orderData ? 'Commande WhatsApp envoyée avec succès' : 'Message WhatsApp envoyé avec succès',
        details: responseText
      });
    } else {
      console.error('Échec envoi WhatsApp:', responseText);
      res.status(500).json({
        success: false,
        message: 'Échec envoi WhatsApp',
        details: responseText
      });
    }

  } catch (error) {
    console.error('Erreur envoi WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
});

// Routes API pour les commandes
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        orderItems: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(orders);
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const {
      orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      deliveryMode,
      orderDate,
      orderTime,
      notes,
      total,
      products
    } = req.body;

    console.log('Données de commande reçues:', { 
      orderNumber, 
      customerName, 
      total, 
      products: products.length 
    });

    // Créer la commande
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        deliveryMode,
        notes,
        totalAmount: parseFloat(total),
        status: 'pending',
        orderItems: {
          create: products.map((product) => ({
            productName: product.name,
            quantity: product.quantity,
            unitPrice: parseFloat(product.price),
            subtotal: parseFloat(product.subtotal)
          }))
        }
      }
    });

    // Récupérer la commande créée avec ses éléments
    const createdOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { orderItems: true }
    });

    res.json(createdOrder);
  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    res.json(order);
  } catch (error) {
    console.error('Erreur lors de la récupération de la commande:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        orderItems: true
      }
    });

    res.json(order);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de la commande:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes API pour les mouvements de stock
app.get('/api/stock-movements', async (req, res) => {
  try {
    const stockMovements = await prisma.stockMovement.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(stockMovements);
  } catch (error) {
    console.error('Erreur lors de la récupération des mouvements de stock:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/stock-movements', async (req, res) => {
  try {
    const {
      product_id,
      movement_type,
      quantity,
      reason,
      reference_number,
      notes,
      created_by
    } = req.body;

    const stockMovement = await prisma.stockMovement.create({
      data: {
        productId: product_id,
        movementType: movement_type,
        quantity: parseInt(quantity),
        reason,
        referenceNumber: reference_number,
        notes,
        createdBy: created_by
      }
    });

    // Mettre à jour la quantité de stock du produit
    if (product_id) {
      const product = await prisma.product.findUnique({
        where: { id: product_id }
      });

      if (product) {
        let newQuantity = product.stockQuantity;
        
        if (movement_type === 'in') {
          newQuantity += parseInt(quantity);
        } else if (movement_type === 'out') {
          newQuantity -= parseInt(quantity);
        } else if (movement_type === 'adjustment') {
          newQuantity = parseInt(quantity);
        }

        // S'assurer que la quantité n'est pas négative
        newQuantity = Math.max(0, newQuantity);

        await prisma.product.update({
          where: { id: product_id },
          data: { stockQuantity: newQuantity }
        });
      }
    }

    res.json(stockMovement);
  } catch (error) {
    console.error('Erreur lors de la création du mouvement de stock:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route de santé générale
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`🚀 Serveur API démarré sur le port ${port}`);
  console.log(`📊 Base de données: ${process.env.DATABASE_URL ? 'Connectée' : 'Non configurée'}`);
  console.log(`📱 WhatsApp API: Configurée avec CallMeBot`);
});

// Routes API pour les services
app.get('/api/services', async (req, res) => {
  try {
    const { active } = req.query;
    const whereClause = {};

    // Filtrer par statut actif si demandé (schema Prisma utilise isActive)
    if (active === 'true') {
      whereClause.isActive = true;
    }

    const services = await prisma.service.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });

    // Mapper vers le format snake_case attendu par le frontend
    const mappedServices = services.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description,
      unit_price: service.unitPrice,
      unit: service.unit,
      category: service.category,
      is_active: service.isActive,
      created_at: service.createdAt,
      updated_at: service.updatedAt
    }));

    res.json(mappedServices);
  } catch (error) {
    console.error('Erreur lors de la récupération des services:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const service = await prisma.service.findUnique({ where: { id } });

    if (!service) {
      return res.status(404).json({ error: 'Service non trouvé' });
    }

    const mappedService = {
      id: service.id,
      name: service.name,
      description: service.description,
      unit_price: service.unitPrice,
      unit: service.unit,
      category: service.category,
      is_active: service.isActive,
      created_at: service.createdAt,
      updated_at: service.updatedAt
    };

    res.json(mappedService);
  } catch (error) {
    console.error('Erreur lors de la récupération du service:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/services', async (req, res) => {
  try {
    // Accepter les deux formes: price/active ou unit_price/is_active
    const { name, description, unit, category } = req.body;
    const unit_price = req.body.unit_price ?? req.body.price;
    const is_active = typeof req.body.is_active === 'boolean' ? req.body.is_active : (req.body.active ?? true);

    const service = await prisma.service.create({
      data: {
        name,
        description,
        unitPrice: unit_price ? parseFloat(unit_price) : null,
        unit,
        category,
        isActive: Boolean(is_active)
      }
    });

    const mappedService = {
      id: service.id,
      name: service.name,
      description: service.description,
      unit_price: service.unitPrice,
      unit: service.unit,
      category: service.category,
      is_active: service.isActive,
      created_at: service.createdAt,
      updated_at: service.updatedAt
    };

    res.status(201).json(mappedService);
  } catch (error) {
    console.error('Erreur lors de la création du service:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, unit, category } = req.body;
    const unit_price = req.body.unit_price ?? req.body.price;
    const is_active = typeof req.body.is_active === 'boolean' ? req.body.is_active : req.body.active;

    const service = await prisma.service.update({
      where: { id },
      data: {
        name,
        description,
        unitPrice: unit_price != null ? parseFloat(unit_price) : undefined,
        unit,
        category,
        isActive: typeof is_active === 'boolean' ? is_active : undefined
      }
    });

    const mappedService = {
      id: service.id,
      name: service.name,
      description: service.description,
      unit_price: service.unitPrice,
      unit: service.unit,
      category: service.category,
      is_active: service.isActive,
      created_at: service.createdAt,
      updated_at: service.updatedAt
    };

    res.json(mappedService);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du service:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Soft delete - marquer comme inactif
    await prisma.service.update({
      where: { id },
      data: { isActive: false }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Erreur lors de la désactivation du service:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes API pour les devis (quotes)
app.get('/api/quotes', async (req, res) => {
  try {
    const quotes = await prisma.quote.findMany({
      include: {
        quoteItems: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Mapper les noms de champs pour correspondre à ce qu'attend le frontend
    const mappedQuotes = quotes.map(quote => ({
      id: quote.id,
      quote_number: quote.quoteNumber,
      customer_name: quote.customerName,
      customer_email: quote.customerEmail,
      customer_phone: quote.customerPhone,
      customer_address: quote.customerAddress,
      issue_date: quote.issueDate,
      expiry_date: quote.expiryDate,
      status: quote.status,
      notes: quote.notes,
      total_amount: quote.totalAmount,
      created_at: quote.createdAt,
      updated_at: quote.updatedAt,
      quote_items: quote.quoteItems.map(item => ({
        id: item.id,
        quote_id: item.quoteId,
        service_id: item.serviceId,
        service_name: item.serviceName,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
        created_at: item.createdAt
      }))
    }));
    
    res.json(mappedQuotes);
  } catch (error) {
    console.error('Erreur lors de la récupération des devis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/quotes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        quoteItems: true
      }
    });
    
    if (!quote) {
      return res.status(404).json({ error: 'Devis non trouvé' });
    }
    
    // Mapper les noms de champs
    const mappedQuote = {
      id: quote.id,
      quote_number: quote.quoteNumber,
      customer_name: quote.customerName,
      customer_email: quote.customerEmail,
      customer_phone: quote.customerPhone,
      customer_address: quote.customerAddress,
      issue_date: quote.issueDate,
      expiry_date: quote.expiryDate,
      status: quote.status,
      notes: quote.notes,
      total_amount: quote.totalAmount,
      created_at: quote.createdAt,
      updated_at: quote.updatedAt,
      quote_items: quote.quoteItems.map(item => ({
        id: item.id,
        quote_id: item.quoteId,
        service_id: item.serviceId,
        service_name: item.serviceName,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
        created_at: item.createdAt
      }))
    };
    
    res.json(mappedQuote);
  } catch (error) {
    console.error('Erreur lors de la récupération du devis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Fonction pour générer un numéro de devis
const generateQuoteNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = String(now.getTime()).slice(-6);
  return `DEV-${year}${month}${day}-${time}`;
};

app.post('/api/quotes', async (req, res) => {
  try {
    const { 
      customer_name, 
      customer_email, 
      customer_phone, 
      customer_address, 
      issue_date, 
      expiry_date, 
      status, 
      notes, 
      total_amount, 
      items 
    } = req.body;
    
    // Créer le devis
    const quote = await prisma.quote.create({
      data: {
        quoteNumber: generateQuoteNumber(),
        customerName: customer_name,
        customerEmail: customer_email,
        customerPhone: customer_phone,
        customerAddress: customer_address,
        issueDate: issue_date || new Date().toISOString(),
        expiryDate: expiry_date,
        status: status || 'draft',
        notes,
        totalAmount: total_amount
      }
    });
    
    // Créer les éléments du devis
    if (items && items.length > 0) {
      await Promise.all(items.map(item => 
        prisma.quoteItem.create({
          data: {
            quoteId: quote.id,
            serviceId: item.service_id,
            serviceName: item.service_name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            subtotal: item.subtotal
          }
        })
      ));
    }
    
    // Récupérer le devis complet avec ses éléments
    const completeQuote = await prisma.quote.findUnique({
      where: { id: quote.id },
      include: { quoteItems: true }
    });
    
    // Mapper les noms de champs pour la réponse
    const mappedQuote = {
      id: completeQuote.id,
      quote_number: completeQuote.quoteNumber,
      customer_name: completeQuote.customerName,
      customer_email: completeQuote.customerEmail,
      customer_phone: completeQuote.customerPhone,
      customer_address: completeQuote.customerAddress,
      issue_date: completeQuote.issueDate,
      expiry_date: completeQuote.expiryDate,
      status: completeQuote.status,
      notes: completeQuote.notes,
      total_amount: completeQuote.totalAmount,
      created_at: completeQuote.createdAt,
      updated_at: completeQuote.updatedAt,
      quote_items: completeQuote.quoteItems.map(item => ({
        id: item.id,
        quote_id: item.quoteId,
        service_id: item.serviceId,
        service_name: item.serviceName,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
        created_at: item.createdAt
      }))
    };
    
    res.status(201).json(mappedQuote);
  } catch (error) {
    console.error('Erreur lors de la création du devis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/quotes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      customer_name, 
      customer_email, 
      customer_phone, 
      customer_address, 
      issue_date, 
      expiry_date, 
      status, 
      notes, 
      total_amount, 
      items 
    } = req.body;
    
    // Mettre à jour le devis
    const quote = await prisma.quote.update({
      where: { id },
      data: {
        customerName: customer_name,
        customerEmail: customer_email,
        customerPhone: customer_phone,
        customerAddress: customer_address,
        issueDate: issue_date,
        expiryDate: expiry_date,
        status,
        notes,
        totalAmount: total_amount
      }
    });
    
    // Supprimer les anciens éléments du devis
    await prisma.quoteItem.deleteMany({
      where: { quoteId: id }
    });
    
    // Créer les nouveaux éléments du devis
    if (items && items.length > 0) {
      await Promise.all(items.map(item => 
        prisma.quoteItem.create({
          data: {
            quoteId: quote.id,
            serviceId: item.service_id,
            serviceName: item.service_name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            subtotal: item.subtotal
          }
        })
      ));
    }
    
    // Récupérer le devis complet avec ses éléments
    const completeQuote = await prisma.quote.findUnique({
      where: { id: quote.id },
      include: { quoteItems: true }
    });
    
    // Mapper les noms de champs pour la réponse
    const mappedQuote = {
      id: completeQuote.id,
      quote_number: completeQuote.quoteNumber,
      customer_name: completeQuote.customerName,
      customer_email: completeQuote.customerEmail,
      customer_phone: completeQuote.customerPhone,
      customer_address: completeQuote.customerAddress,
      issue_date: completeQuote.issueDate,
      expiry_date: completeQuote.expiryDate,
      status: completeQuote.status,
      notes: completeQuote.notes,
      total_amount: completeQuote.totalAmount,
      created_at: completeQuote.createdAt,
      updated_at: completeQuote.updatedAt,
      quote_items: completeQuote.quoteItems.map(item => ({
        id: item.id,
        quote_id: item.quoteId,
        service_id: item.serviceId,
        service_name: item.serviceName,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
        created_at: item.createdAt
      }))
    };
    
    res.json(mappedQuote);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du devis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/quotes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Supprimer d'abord les éléments du devis
    await prisma.quoteItem.deleteMany({
      where: { quoteId: id }
    });
    
    // Puis supprimer le devis
    await prisma.quote.delete({
      where: { id }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Erreur lors de la suppression du devis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Convertir un devis en facture
app.post('/api/quotes/:id/convert', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer le devis avec ses éléments
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { quoteItems: true }
    });
    
    if (!quote) {
      return res.status(404).json({ error: 'Devis non trouvé' });
    }
    
    // Générer un numéro de facture
    const generateInvoiceNumber = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const timestamp = now.getTime();
      return `FACT-${year}${month}-${timestamp.toString().slice(-6)}`;
    };
    
    // Créer la facture
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        customerName: quote.customerName,
        customerEmail: quote.customerEmail,
        customerPhone: quote.customerPhone,
        customerAddress: quote.customerAddress,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Due date: 30 jours
        status: 'draft',
        notes: quote.notes,
        totalAmount: quote.totalAmount
      }
    });
    
    // Créer les éléments de la facture à partir des éléments du devis
    await Promise.all(quote.quoteItems.map(item => 
      prisma.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          description: item.description || item.serviceName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal
        }
      })
    ));
    
    // Mettre à jour le statut du devis
    await prisma.quote.update({
      where: { id },
      data: { status: 'converted' }
    });
    
    // Récupérer la facture complète avec ses éléments
    const completeInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: { invoiceItems: true }
    });
    
    // Mapper les noms de champs pour la réponse
    const mappedInvoice = {
      id: completeInvoice.id,
      invoice_number: completeInvoice.invoiceNumber,
      customer_name: completeInvoice.customerName,
      customer_email: completeInvoice.customerEmail,
      customer_phone: completeInvoice.customerPhone,
      customer_address: completeInvoice.customerAddress,
      due_date: completeInvoice.dueDate,
      status: completeInvoice.status,
      notes: completeInvoice.notes,
      total_amount: completeInvoice.totalAmount,
      created_at: completeInvoice.createdAt,
      updated_at: completeInvoice.updatedAt,
      invoice_items: completeInvoice.invoiceItems.map(item => ({
        id: item.id,
        invoice_id: item.invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
        created_at: item.createdAt
      }))
    };
    
    res.status(201).json(mappedInvoice);
  } catch (error) {
    console.error('Erreur lors de la conversion du devis en facture:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes API pour les factures (invoices)
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        invoiceItems: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Mapper les noms de champs pour correspondre à ce qu'attend le frontend
    const mappedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoice_number: invoice.invoiceNumber,
      customer_name: invoice.customerName,
      customer_email: invoice.customerEmail,
      customer_phone: invoice.customerPhone,
      customer_address: invoice.customerAddress,
      issue_date: invoice.issueDate || invoice.createdAt,
      due_date: invoice.dueDate,
      status: invoice.status,
      notes: invoice.notes,
      total_amount: invoice.totalAmount,
      created_at: invoice.createdAt,
      updated_at: invoice.updatedAt,
      invoice_items: invoice.invoiceItems.map(item => ({
        id: item.id,
        invoice_id: item.invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
        created_at: item.createdAt
      }))
    }));
    
    res.json(mappedInvoices);
  } catch (error) {
    console.error('Erreur lors de la récupération des factures:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        invoiceItems: true
      }
    });
    
    if (!invoice) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }
    
    // Mapper les noms de champs
    const mappedInvoice = {
      id: invoice.id,
      invoice_number: invoice.invoiceNumber,
      customer_name: invoice.customerName,
      customer_email: invoice.customerEmail,
      customer_phone: invoice.customerPhone,
      customer_address: invoice.customerAddress,
      issue_date: invoice.issueDate || invoice.createdAt,
      due_date: invoice.dueDate,
      status: invoice.status,
      notes: invoice.notes,
      total_amount: invoice.totalAmount,
      created_at: invoice.createdAt,
      updated_at: invoice.updatedAt,
      invoice_items: invoice.invoiceItems.map(item => ({
        id: item.id,
        invoice_id: item.invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
        created_at: item.createdAt
      }))
    };
    
    res.json(mappedInvoice);
  } catch (error) {
    console.error('Erreur lors de la récupération de la facture:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Fonction pour générer un numéro de facture
const generateInvoiceNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const timestamp = now.getTime();
  return `FACT-${year}${month}-${timestamp.toString().slice(-6)}`;
};

app.post('/api/invoices', async (req, res) => {
  try {
    const { 
      customer_name, 
      customer_email, 
      customer_phone, 
      customer_address, 
      issue_date, 
      due_date, 
      status, 
      notes, 
      total_amount, 
      items 
    } = req.body;
    
    // Créer la facture
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        customerName: customer_name,
        customerEmail: customer_email,
        customerPhone: customer_phone,
        customerAddress: customer_address,
        issueDate: issue_date || new Date().toISOString(),
        dueDate: due_date,
        status: status || 'draft',
        notes,
        totalAmount: total_amount
      }
    });
    
    // Créer les éléments de la facture
    if (items && items.length > 0) {
      await Promise.all(items.map(item => 
        prisma.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            subtotal: item.subtotal
          }
        })
      ));
    }
    
    // Récupérer la facture complète avec ses éléments
    const completeInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: { invoiceItems: true }
    });
    
    // Mapper les noms de champs pour la réponse
    const mappedInvoice = {
      id: completeInvoice.id,
      invoice_number: completeInvoice.invoiceNumber,
      customer_name: completeInvoice.customerName,
      customer_email: completeInvoice.customerEmail,
      customer_phone: completeInvoice.customerPhone,
      customer_address: completeInvoice.customerAddress,
      issue_date: completeInvoice.issueDate,
      due_date: completeInvoice.dueDate,
      status: completeInvoice.status,
      notes: completeInvoice.notes,
      total_amount: completeInvoice.totalAmount,
      created_at: completeInvoice.createdAt,
      updated_at: completeInvoice.updatedAt,
      invoice_items: completeInvoice.invoiceItems.map(item => ({
        id: item.id,
        invoice_id: item.invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
        created_at: item.createdAt
      }))
    };
    
    res.status(201).json(mappedInvoice);
  } catch (error) {
    console.error('Erreur lors de la création de la facture:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      customer_name, 
      customer_email, 
      customer_phone, 
      customer_address, 
      issue_date, 
      due_date, 
      status, 
      notes, 
      total_amount, 
      items 
    } = req.body;
    
    // Mettre à jour la facture
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        customerName: customer_name,
        customerEmail: customer_email,
        customerPhone: customer_phone,
        customerAddress: customer_address,
        issueDate: issue_date,
        dueDate: due_date,
        status,
        notes,
        totalAmount: total_amount
      }
    });
    
    // Supprimer les anciens éléments de la facture
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: id }
    });
    
    // Créer les nouveaux éléments de la facture
    if (items && items.length > 0) {
      await Promise.all(items.map(item => 
        prisma.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            subtotal: item.subtotal
          }
        })
      ));
    }
    
    // Récupérer la facture complète avec ses éléments
    const completeInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: { invoiceItems: true }
    });
    
    // Mapper les noms de champs pour la réponse
    const mappedInvoice = {
      id: completeInvoice.id,
      invoice_number: completeInvoice.invoiceNumber,
      customer_name: completeInvoice.customerName,
      customer_email: completeInvoice.customerEmail,
      customer_phone: completeInvoice.customerPhone,
      customer_address: completeInvoice.customerAddress,
      issue_date: completeInvoice.issueDate,
      due_date: completeInvoice.dueDate,
      status: completeInvoice.status,
      notes: completeInvoice.notes,
      total_amount: completeInvoice.totalAmount,
      created_at: completeInvoice.createdAt,
      updated_at: completeInvoice.updatedAt,
      invoice_items: completeInvoice.invoiceItems.map(item => ({
        id: item.id,
        invoice_id: item.invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
        created_at: item.createdAt
      }))
    };
    
    res.json(mappedInvoice);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la facture:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/invoices/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status }
    });
    
    // Mapper les noms de champs pour la réponse
    const mappedInvoice = {
      id: invoice.id,
      invoice_number: invoice.invoiceNumber,
      status: invoice.status,
      updated_at: invoice.updatedAt
    };
    
    res.json(mappedInvoice);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de la facture:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Supprimer d'abord les éléments de la facture
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: id }
    });
    
    // Puis supprimer la facture
    await prisma.invoice.delete({
      where: { id }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Erreur lors de la suppression de la facture:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
