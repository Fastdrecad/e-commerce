import { AppProvider } from "@/app/Provider";
import { AppRouter } from "@/app/router";

// Translations
import "@/localization/i18n";

export const App = () => {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
};
