import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Recycle } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="text-center space-y-6 p-8">
        <div className="flex justify-center mb-6">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Recycle className="h-12 w-12 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-4xl font-bold">Smart Sewage Management System</h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          Efficient waste management for a cleaner tomorrow
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Button onClick={() => navigate("/auth")} size="lg">
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
