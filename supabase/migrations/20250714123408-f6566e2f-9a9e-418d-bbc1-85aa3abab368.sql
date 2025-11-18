-- Table pour gérer les niveaux de stock des produits
ALTER TABLE public.products 
ADD COLUMN stock_quantity INTEGER DEFAULT 0,
ADD COLUMN min_stock_level INTEGER DEFAULT 5,
ADD COLUMN stock_status TEXT DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock'));

-- Table pour l'historique des mouvements de stock
CREATE TABLE public.stock_movements (
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

-- Enable RLS sur la table stock_movements
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre toutes les opérations sur stock_movements
CREATE POLICY "Allow all operations on stock_movements" 
ON public.stock_movements 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Table pour les alertes de stock
CREATE TABLE public.stock_alerts (
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

-- Enable RLS sur la table stock_alerts
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre toutes les opérations sur stock_alerts
CREATE POLICY "Allow all operations on stock_alerts" 
ON public.stock_alerts 
FOR ALL 
USING (true) 
WITH CHECK (true);

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

-- Mettre à jour les produits existants avec un stock par défaut
UPDATE public.products 
SET stock_quantity = 10, min_stock_level = 5, stock_status = 'in_stock' 
WHERE stock_quantity IS NULL;