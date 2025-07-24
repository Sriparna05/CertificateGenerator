import { useEffect, useState } from "react";

interface PageTransitionProps {
  children: React.ReactNode;
  currentStep: string;
}

export const PageTransition = ({ children, currentStep }: PageTransitionProps) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsTransitioning(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [currentStep, children]);

  return (
    <div className="relative min-h-screen">
      <div
        className={`transition-all duration-300 ease-in-out ${
          isTransitioning 
            ? 'opacity-0 transform scale-95 blur-sm' 
            : 'opacity-100 transform scale-100 blur-0'
        }`} >
        {displayChildren}
      </div>
      {/* Transition overlay effect */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-gradient-tech/5 animate-pulse" />
      )}
    </div>
  );
};
