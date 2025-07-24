export const TechBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-subtle" />
      {/* Floating Blobs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-glow rounded-full mix-blend-multiply filter blur-xl animate-blob-bounce opacity-70" />
      <div className="absolute top-40 right-20 w-80 h-80 bg-gradient-primary rounded-full mix-blend-multiply filter blur-xl animate-float opacity-60" style={{ animationDelay: '2s' }} />
      <div className="absolute -bottom-8 left-40 w-96 h-96 bg-gradient-tech rounded-full mix-blend-multiply filter blur-xl animate-blob-bounce opacity-50" style={{ animationDelay: '4s' }} />
      <div className="absolute bottom-40 right-40 w-72 h-72 bg-accent/30 rounded-full mix-blend-multiply filter blur-xl animate-float opacity-40" style={{ animationDelay: '1s' }} />
      {/* Tech Grid Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>
      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full animate-matrix-rain"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};
