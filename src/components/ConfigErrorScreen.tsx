import VerityLogo from "@/components/VerityLogo";

interface ConfigErrorScreenProps {
  missingKeys: string[];
}

const ConfigErrorScreen = ({ missingKeys }: ConfigErrorScreenProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-xl border border-destructive/40 bg-card p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <VerityLogo className="h-8 w-auto" linkTo="/" />
          <span className="text-xs uppercase tracking-wide text-destructive">Config Error</span>
        </div>

        <h1 className="font-serif text-2xl mb-3">Runtime configuration is incomplete</h1>
        <p className="text-sm text-muted-foreground mb-5">
          Verity cannot boot because required Supabase environment variables are missing in
          this deployment.
        </p>

        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-sm font-medium mb-2">Missing keys:</p>
          <ul className="space-y-1">
            {missingKeys.map((key) => (
              <li key={key} className="font-mono text-xs text-destructive">
                {key}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ConfigErrorScreen;
