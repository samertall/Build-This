import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden font-sans p-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-border shadow-lg shadow-primary/5 overflow-hidden">
          <div className="h-2 w-full bg-primary/20" />
          <CardContent className="pt-10 pb-10 px-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
                <AlertCircle className="h-8 w-8" />
              </div>
            </div>
            
            <h1 className="text-4xl font-extrabold text-foreground mb-3 tracking-tight">404</h1>
            <h2 className="text-xl font-bold text-foreground mb-4">Page Not Found</h2>
            
            <p className="text-base text-muted-foreground mb-8 leading-relaxed font-medium">
              We couldn't find the page you're looking for. It might have been moved or deleted.
            </p>
            
            <Link href="/">
              <Button size="lg" className="w-full font-bold shadow-sm">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Return to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
