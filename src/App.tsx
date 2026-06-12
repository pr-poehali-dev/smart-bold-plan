
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Modeling from "./pages/Modeling";
import Printing from "./pages/Printing";
import Auth from "./pages/Auth";
import Cart from "./pages/Cart";
import Favorites from "./pages/Favorites";
import Orders from "./pages/Orders";
import Tracking from "./pages/Tracking";
import Checkout from "./pages/Checkout";
import Account from "./pages/Account";
import Partner from "./pages/Partner";
import Terms from "./pages/Terms";
import OAuthCallback from "./pages/OAuthCallback";
import ChatWidget from "./components/ChatWidget";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { LanguageProvider } from "./context/LanguageContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LanguageProvider>
        <AuthProvider>
          <CartProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/modeling" element={<Modeling />} />
            <Route path="/printing" element={<Printing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<Orders />} />
            <Route path="/tracking/:id" element={<Tracking />} />
            <Route path="/checkout/:id" element={<Checkout />} />
            <Route path="/account" element={<Account />} />
            <Route path="/partner" element={<Partner />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </CartProvider>
        </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
      <ChatWidget />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;