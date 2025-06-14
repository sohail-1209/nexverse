export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh_-_theme(spacing.32))]">
      {children}
    </div>
  );
}
