
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { TabsContent, TabsList, Tabs, TabsTrigger } from "@/components/ui/tabs";
import PageBanner from "@/components/PageBanner";
import ProductsAdmin from "@/components/admin/ProductsAdmin";
import ContentAdmin from "@/components/admin/ContentAdmin";
import CategoriesAdmin from "@/components/admin/CategoriesAdmin";
import OrdersAdmin from "@/components/admin/OrdersAdmin";
import InvoicesAdmin from "@/components/admin/InvoicesAdmin";
import StockAdmin from "@/components/admin/StockAdmin";
import { QuotesAdmin } from "@/components/admin/QuotesAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isPrismaConfigured, checkPrismaTablesExist } from "@/lib/api";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Constante pour le mot de passe (dans un cas réel, ceci devrait être géré côté serveur)
const ADMIN_PASSWORD = "kbs2024admin";

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [prismaConfigured, setPrismaConfigured] = useState(false);
  const [tablesExist, setTablesExist] = useState(false);
  const navigate = useNavigate();

  // Vérifier si l'utilisateur est déjà authentifié
  useEffect(() => {
    const authStatus = sessionStorage.getItem("kbs_admin_auth");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
    
    // Vérifier la configuration Prisma
    checkPrismaConfiguration();
  }, []);

  // Vérification de la configuration Prisma
  const checkPrismaConfiguration = async () => {
    // D'abord vérifier si les variables d'environnement sont configurées
    const configured = isPrismaConfigured();
    setPrismaConfigured(configured);

    if (!configured) {
      toast.error("Configuration Prisma manquante. Veuillez configurer la variable d'environnement DATABASE_URL.");
      return;
    }

    try {
      // Tester si les tables existent
      const tablesExistResult = await checkPrismaTablesExist();

      if (!tablesExistResult) {
        console.error('Les tables nécessaires n\'existent pas dans la base de données Prisma.');
        setTablesExist(false);
      } else {
        setTablesExist(true);
      }

    } catch (error) {
      console.error('Erreur lors de la vérification de la configuration Prisma:', error);
      setPrismaConfigured(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulation d'un délai de chargement pour donner l'impression d'une vérification
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem("kbs_admin_auth", "true");
        setIsAuthenticated(true);
        toast.success("Connexion réussie");
      } else {
        toast.error("Mot de passe incorrect");
      }
      setIsLoading(false);
    }, 800);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("kbs_admin_auth");
    setIsAuthenticated(false);
    setPassword("");
    toast.info("Vous avez été déconnecté");
  };

  return (
    <div>
      <PageBanner
        title="Administration"
        subtitle={isAuthenticated ? "Gérez le contenu de votre site" : "Veuillez vous connecter pour accéder au panneau d'administration"}
      >
        {isAuthenticated && (
          <div className="mt-4">
            <Button 
              variant="outline" 
              className="bg-white text-kbs-brown hover:bg-kbs-gold/20" 
              onClick={handleLogout}
            >
              Se déconnecter
            </Button>
            <Button 
              variant="outline" 
              className="bg-white text-kbs-brown hover:bg-kbs-gold/20 ml-2" 
              onClick={() => navigate("/")}
            >
              Retour au site
            </Button>
          </div>
        )}
      </PageBanner>

      <div className="container-custom py-8">
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez le mot de passe admin"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-kbs-green hover:bg-kbs-green/90"
                disabled={isLoading}
              >
                {isLoading ? "Connexion en cours..." : "Se connecter"}
              </Button>
            </form>
          </div>
        ) : (
          <>
            {!prismaConfigured && (
              <Alert variant="destructive" className="mb-8">
                <AlertCircle className="h-6 w-6" />
                <AlertTitle>Configuration Prisma requise</AlertTitle>
                <AlertDescription>
                  <p>
                    La variable d'environnement DATABASE_URL est manquante. Veuillez suivre ces étapes pour configurer votre projet :
                  </p>
                  <ol className="list-decimal list-inside mt-2 ml-4 space-y-1">
                    <li>Vérifiez votre fichier .env</li>
                    <li>Configurez la variable <strong>DATABASE_URL</strong> avec l'URL de votre base de données Neon</li>
                    <li>Rechargez l'application</li>
                  </ol>
                </AlertDescription>
              </Alert>
            )}

            {prismaConfigured && !tablesExist && (
              <Alert variant="destructive" className="mb-8">
                <AlertCircle className="h-6 w-6" />
                <AlertTitle>Tables de base de données requises</AlertTitle>
                <AlertDescription>
                  <p>
                    Les tables nécessaires n'existent pas dans votre base de données. Les tables suivantes sont requises :
                  </p>
                  <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                    <li><strong>categories</strong> - Pour les catégories de produits</li>
                    <li><strong>products</strong> - Pour stocker les informations des produits</li>
                    <li><strong>stock_movements</strong> - Pour l'historique des mouvements de stock</li>
                    <li><strong>stock_alerts</strong> - Pour les alertes de stock</li>
                    <li><strong>orders</strong> - Pour les commandes</li>
                    <li><strong>order_items</strong> - Pour les articles des commandes</li>
                    <li><strong>site_content</strong> - Pour le contenu du site</li>
                  </ul>
                  <p className="mt-2">
                    Les tables ont été créées automatiquement via Prisma. Si vous voyez cette erreur, vérifiez la connexion à votre base de données Neon.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="products">
              <TabsList className="mb-8">
                <TabsTrigger value="products">Produits</TabsTrigger>
                <TabsTrigger value="categories">Catégories</TabsTrigger>
                <TabsTrigger value="stock">Stock</TabsTrigger>
                <TabsTrigger value="orders">Commandes</TabsTrigger>
                <TabsTrigger value="quotes">Devis</TabsTrigger>
                <TabsTrigger value="invoices">Factures</TabsTrigger>
                <TabsTrigger value="content">Contenu du site</TabsTrigger>
              </TabsList>
              <TabsContent value="products">
                <ProductsAdmin />
              </TabsContent>
              <TabsContent value="categories">
                <CategoriesAdmin />
              </TabsContent>
              <TabsContent value="stock">
                <StockAdmin />
              </TabsContent>
              <TabsContent value="orders">
                <OrdersAdmin />
              </TabsContent>
              <TabsContent value="quotes">
                <QuotesAdmin />
              </TabsContent>
              <TabsContent value="invoices">
                <InvoicesAdmin />
              </TabsContent>

              <TabsContent value="content">
                <ContentAdmin />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
