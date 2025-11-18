-- Schema complet pour KB&S - Base de données Supabase
-- À exécuter dans l'éditeur SQL de Supabase ou en local

-- ==============================================
-- TABLE: CATEGORIES
-- ==============================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE
);

-- Enable RLS sur categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre toutes les opérations sur categories
CREATE POLICY "Allow all operations on categories" 
ON public.categories 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Politique pour l'accès en lecture publique aux catégories
CREATE POLICY "Allow public read access to categories" 
ON public.categories 
FOR SELECT 
USING (true);

-- ==============================================
-- TABLE: PRODUCTS
-- ==============================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    price NUMERIC NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    -- Colonnes pour la gestion de stock
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    stock_status TEXT DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock'))
);

-- Enable RLS sur products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre toutes les opérations sur products
CREATE POLICY "Allow all operations on products" 
ON public.products 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Politique pour l'accès en lecture publique aux produits
CREATE POLICY "Allow public read access to products" 
ON public.products 
FOR SELECT 
USING (true);

-- ==============================================
-- TABLE: STOCK_MOVEMENTS
-- ==============================================
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    reason TEXT,
    reference_number TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by TEXT DEFAULT 'admin',
    CONSTRAINT fk_stock_movements_product 
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- Enable RLS sur stock_movements
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre toutes les opérations sur stock_movements
CREATE POLICY "Allow all operations on stock_movements" 
ON public.stock_movements 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- ==============================================
-- TABLE: STOCK_ALERTS
-- ==============================================
CREATE TABLE IF NOT EXISTS public.stock_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock')),
    current_quantity INTEGER NOT NULL,
    threshold_quantity INTEGER NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_stock_alerts_product 
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- Enable RLS sur stock_alerts
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre toutes les opérations sur stock_alerts
CREATE POLICY "Allow all operations on stock_alerts" 
ON public.stock_alerts 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- ==============================================
-- TABLE: ORDERS
-- ==============================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    total_amount NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'pending',
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    delivery_mode TEXT NOT NULL,
    notes TEXT
);

-- Enable RLS sur orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre toutes les opérations sur orders
CREATE POLICY "Allow all access to orders" 
ON public.orders 
FOR ALL 
USING (true);

-- ==============================================
-- TABLE: ORDER_ITEMS
-- ==============================================
CREATE TABLE IF NOT EXISTS public.order_items (
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC NOT NULL,
    subtotal NUMERIC NOT NULL,
    product_name TEXT NOT NULL,
    CONSTRAINT fk_order_items_order 
        FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE
);

-- Enable RLS sur order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre toutes les opérations sur order_items
CREATE POLICY "Allow all access to order_items" 
ON public.order_items 
FOR ALL 
USING (true);

-- ==============================================
-- TABLE: SITE_CONTENT
-- ==============================================
CREATE TABLE IF NOT EXISTS public.site_content (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    section TEXT NOT NULL,
    field TEXT NOT NULL,
    value TEXT,
    UNIQUE(section, field)
);

-- Enable RLS sur site_content
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre toutes les opérations sur site_content
CREATE POLICY "Allow all operations on site_content" 
ON public.site_content 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Politique pour l'accès en lecture publique au contenu du site
CREATE POLICY "Allow public read access to site_content" 
ON public.site_content 
FOR SELECT 
USING (true);

-- ==============================================
-- FUNCTIONS & TRIGGERS
-- ==============================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour products
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour orders
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour site_content
CREATE TRIGGER update_site_content_updated_at
    BEFORE UPDATE ON public.site_content
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour mettre à jour le statut du stock automatiquement
CREATE OR REPLACE FUNCTION public.update_stock_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour le statut en fonction du stock
    IF NEW.stock_quantity <= 0 THEN
        NEW.stock_status := 'out_of_stock';
    ELSIF NEW.stock_quantity <= NEW.min_stock_level THEN
        NEW.stock_status := 'low_stock';
    ELSE
        NEW.stock_status := 'in_stock';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement le statut du stock
CREATE TRIGGER update_product_stock_status
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_stock_status();

-- Fonction pour créer des alertes automatiquement
CREATE OR REPLACE FUNCTION public.create_stock_alert()
RETURNS TRIGGER AS $$
BEGIN
    -- Créer une alerte si le stock est faible ou épuisé
    IF NEW.stock_status IN ('low_stock', 'out_of_stock') AND 
       (OLD.stock_status IS NULL OR OLD.stock_status = 'in_stock') THEN
        
        INSERT INTO public.stock_alerts (
            product_id, 
            alert_type, 
            current_quantity, 
            threshold_quantity
        ) VALUES (
            NEW.id,
            NEW.stock_status,
            NEW.stock_quantity,
            NEW.min_stock_level
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer des alertes automatiquement
CREATE TRIGGER create_stock_alert_trigger
    AFTER UPDATE ON public.products  
    FOR EACH ROW
    EXECUTE FUNCTION public.create_stock_alert();

-- Fonction pour mettre à jour le contenu du site (conservée de l'ancien schéma)
CREATE OR REPLACE FUNCTION public.upsert_site_content(content_items JSONB[])
RETURNS void AS $$
DECLARE
  item JSONB;
BEGIN
  FOR item IN SELECT * FROM unnest(content_items) LOOP
    INSERT INTO public.site_content (section, field, value, updated_at)
    VALUES (
      item->>'section',
      item->>'field',
      item->>'value',
      COALESCE((item->>'updated_at')::TIMESTAMP WITH TIME ZONE, now())
    )
    ON CONFLICT (section, field) DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = EXCLUDED.updated_at;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- STORAGE BUCKETS
-- ==============================================
-- Création du bucket pour les images
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- DONNÉES INITIALES
-- ==============================================

-- Insérer des catégories par défaut (mise à jour avec les anciennes + nouvelles)
INSERT INTO public.categories (name, slug) VALUES 
    ('Miels', 'miels'),
    ('Huiles', 'huiles'),
    ('Poudres', 'poudres'),
    ('Céréales', 'cereales'),
    ('Pâtes', 'pates'),
    ('Graines', 'graines'),
    ('Agriculture', 'agriculture'),
    ('Élevage', 'elevage'),
    ('Matériel', 'materiel'),
    ('Services', 'services')
ON CONFLICT (slug) DO NOTHING;

-- Insérer du contenu de site par défaut
INSERT INTO public.site_content (section, field, value) VALUES 
    ('home', 'hero_title', 'KB&S - Votre partenaire agricole au Sénégal'),
    ('home', 'hero_subtitle', 'Solutions complètes pour l''agriculture et l''élevage'),
    ('about', 'title', 'À propos de KB&S'),
    ('about', 'description', 'KB&S est votre partenaire de confiance pour tous vos besoins agricoles et d''élevage au Sénégal.'),
    ('contact', 'address', 'Sénégal'),
    ('contact', 'phone', '+221 77 029 98 21'),
    ('contact', 'email', 'kewekane@yahoo.fr')
ON CONFLICT (section, field) DO NOTHING;

-- Mettre à jour les produits existants avec des valeurs de stock par défaut
UPDATE public.products 
SET 
    stock_quantity = COALESCE(stock_quantity, 10), 
    min_stock_level = COALESCE(min_stock_level, 5), 
    stock_status = COALESCE(stock_status, 'in_stock')
WHERE stock_quantity IS NULL OR min_stock_level IS NULL OR stock_status IS NULL;