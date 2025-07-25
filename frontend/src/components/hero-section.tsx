import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Zap, Download, Users } from "lucide-react";
import { TechBackground } from "@/components/tech-background";

interface HeroSectionProps {
  onGetStarted: () => void;
  onViewTemplates: () => void;
}

export const HeroSection = ({ onGetStarted, onViewTemplates }: HeroSectionProps) => {
  const features = [
    {
      icon: Upload,
      title: "Easy Upload",
      description: "Upload CSV files or enter data manually",
    },
    {
      icon: Zap,
      title: "AI-Powered",
      description: "Smart template selection and customization",
    },
    {
      icon: Download,
      title: "Instant Download",
      description: "Generate and download certificates in seconds",
    },
    {
      icon: Users,
      title: "Bulk Processing",
      description: "Create hundreds of certificates at once",
    },
  ];

  return (
    <div className="min-h-screen relative flex flex-col">
      <TechBackground />
      {/* Hero Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-16 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-tech bg-clip-text text-transparent mb-6 animate-fade-in">
              AI-Powered Certificate Generator
            </h1>
            <p
              className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              Create professional course completion certificates in seconds.
              Upload your data, choose a template, and generate beautiful PDFs
              automatically.
            </p>
            <div
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              <Button
                variant="hero"
                size="lg"
                onClick={onGetStarted}
                className="text-lg px-8 py-6 h-auto hover:shadow-neon transition-all duration-300 hover:scale-105 group"
              >
                <span className="relative z-10">Generate Certificates</span>
                <Zap className="w-5 h-5 ml-2 group-hover:animate-bounce" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={onViewTemplates}
                className="text-lg px-8 py-6 h-auto hover:bg-primary/10 hover:border-primary transition-all duration-300 hover:scale-105"
              >
                View Templates
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 bg-gradient-card/80 backdrop-blur-sm shadow-card border-0 hover:shadow-neon transition-all duration-500 hover:-translate-y-2 hover:scale-105 group cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 bg-gradient-tech rounded-lg flex items-center justify-center mb-4 mx-auto transition-all duration-300 group-hover:scale-110">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-background/80 backdrop-blur border-t border-primary/20 relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="group hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-3xl font-bold bg-gradient-tech bg-clip-text text-transparent mb-2">
                10,000+
              </div>
              <div className="text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                Certificates Generated
              </div>
            </div>
            <div
              className="group hover:scale-105 transition-all duration-300 cursor-pointer"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="text-3xl font-bold bg-gradient-tech bg-clip-text text-transparent mb-2">
                50+
              </div>
              <div className="text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                Professional Templates
              </div>
            </div>
            <div
              className="group hover:scale-105 transition-all duration-300 cursor-pointer"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="text-3xl font-bold bg-gradient-tech bg-clip-text text-transparent mb-2">
                99.9%
              </div>
              <div className="text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                Uptime Reliability
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
